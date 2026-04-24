"""Otimizador de documentos: PDF/HTML bruto → Markdown denso, leve e sem perda de contexto.

Pipeline:
  1. Classifica documento (HTML estruturado, PDF texto-dominante, PDF imagem-dominante).
  2. Extrai texto + imagens com posições (PyMuPDF).
  3. Triagem heurística de imagens (tamanho, aspect ratio, entropia, pHash).
  4. Classificação vision opcional das sobreviventes (Haiku 4.5 via API).
  5. Reconstrói Markdown mantendo ordem natural texto→imagem→texto.

Saída: data/fiis-optimized/{TICKER}/
  {id}.md           — texto consolidado (contexto preservado)
  {id}.meta.json    — metadados (original vs otimizado, imagens descartadas/mantidas)
  imagens/          — imagens relevantes extraídas (referenciadas no .md)

Uso:
  python3 otimizar.py HGLG11                      # todos docs HGLG11
  python3 otimizar.py HGLG11 --doc 937592         # 1 doc específico
  python3 otimizar.py HGLG11 --sem-vision         # só heurística, sem API
  python3 otimizar.py HGLG11 --workers 4
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

from paths import DATA

FIIS_RAW = DATA / "fiis-raw"
FIIS_OPTIMIZED = DATA / "fiis-optimized"

# ---------------------------------------------------------------------------
# Configuração de triagem heurística
# ---------------------------------------------------------------------------

MIN_WIDTH = 150               # imagens mais estreitas → descarta
MIN_HEIGHT = 100              # imagens mais baixas → descarta
MIN_AREA = 30_000             # pixels mínimos (ex.: 200×150) — evita ícones
MAX_ASPECT_RATIO = 6.0        # banners/linhas decorativas — descarta
MIN_ENTROPIA_BITS = 3.5       # imagens "quase vazias" → descarta
MIN_BYTES = 3_000             # PNGs/JPEGs muito pequenos → ícone/logo
PHASH_SIZE = 16               # pHash 16x16 = 256 bits — alta precisão

# Cache perceptual global por fundo (detecta imagens repetidas entre docs)
CacheHashFundo = dict[str, dict]

# ---------------------------------------------------------------------------
# Detecção de tipo de documento
# ---------------------------------------------------------------------------

def classificar_documento(arquivo: Path, tipo_doc: str) -> str:
    """Retorna 'html_estruturado' | 'pdf_texto' | 'pdf_imagem'."""
    ext = arquivo.suffix.lower()
    if ext in (".html", ".htm"):
        return "html_estruturado"

    if ext != ".pdf":
        return "outro"

    # PDF: verifica se o texto extraível é significativo
    try:
        import fitz
        doc = fitz.open(arquivo)
        total_chars = 0
        for p in doc:
            total_chars += len(p.get_text("text") or "")
        total_paginas = len(doc)
        doc.close()
        # Menos de 400 chars por página = provavelmente texto renderizado
        # como paths/imagem. Usamos 400 (mais rigoroso que 200) porque
        # PDFs da Pátria antigos têm bullets vazios que dão 150-200 chars
        # mas praticamente nenhum conteúdo real.
        if total_paginas > 0 and total_chars / total_paginas < 400:
            return "pdf_imagem"
        return "pdf_texto"
    except Exception:
        return "pdf_texto"


def _renderizar_paginas_como_imagens(arquivo: Path, pasta_out: Path,
                                     dpi: int = 144, max_paginas: int = 40) -> list[dict]:
    """Para PDFs onde o texto não é extraível, renderiza cada página como PNG
    para posterior revisão manual via LLM no chat.

    Retorna lista de metadados das páginas renderizadas.
    """
    import fitz
    pasta_out.mkdir(parents=True, exist_ok=True)
    resultado: list[dict] = []
    doc = fitz.open(arquivo)
    total = min(len(doc), max_paginas)
    for i in range(total):
        page = doc[i]
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        dst = pasta_out / f"pagina_{i+1:03d}.png"
        pix.save(str(dst))
        resultado.append({
            "arquivo": dst.name,
            "pagina": i + 1,
            "largura": pix.width,
            "altura": pix.height,
            "bytes_size": dst.stat().st_size,
        })
    doc.close()
    return resultado


# ---------------------------------------------------------------------------
# Triagem heurística de imagem
# ---------------------------------------------------------------------------

@dataclass
class AnaliseImagem:
    xref: int
    pagina: int
    bbox: tuple[float, float, float, float]
    largura: int
    altura: int
    bytes_size: int
    hash_perceptual: str
    hash_md5: str
    formato: str
    descartar: bool = False
    motivo_descarte: str = ""
    classificacao_vision: Optional[dict] = None
    # v1.1: se a imagem tem muito texto dentro (gráfico com labels/valores)
    # marcamos como candidata a refinamento manual
    candidata_refinamento: bool = False
    texto_sobreposto_amostra: Optional[list[str]] = None


def _entropia(img) -> float:
    """Aproxima entropia por histograma de brilho."""
    try:
        from PIL import Image
        import math
        g = img.convert("L").resize((64, 64))
        hist = g.histogram()
        total = sum(hist)
        if total == 0:
            return 0
        entropia = 0
        for c in hist:
            if c > 0:
                p = c / total
                entropia -= p * math.log2(p)
        return entropia
    except Exception:
        return 0


def triagem_heuristica(info: AnaliseImagem, img_pil) -> None:
    """Preenche descartar/motivo em info baseado em regras."""
    if info.bytes_size < MIN_BYTES:
        info.descartar = True
        info.motivo_descarte = "muito_pequena_em_bytes"
        return

    if info.largura < MIN_WIDTH or info.altura < MIN_HEIGHT:
        info.descartar = True
        info.motivo_descarte = "dimensao_pequena"
        return

    area = info.largura * info.altura
    if area < MIN_AREA:
        info.descartar = True
        info.motivo_descarte = "area_pequena"
        return

    ar = max(info.largura, info.altura) / max(1, min(info.largura, info.altura))
    if ar > MAX_ASPECT_RATIO:
        info.descartar = True
        info.motivo_descarte = f"aspect_ratio_{ar:.1f}"
        return

    e = _entropia(img_pil)
    if e < MIN_ENTROPIA_BITS:
        info.descartar = True
        info.motivo_descarte = f"baixa_entropia_{e:.2f}"
        return


def triagem_repetidas(imagens: list[AnaliseImagem], cache_fundo: CacheHashFundo) -> None:
    """Descarta imagens cujo pHash já aparece em outros docs do mesmo fundo.

    Política: a 1ª ocorrência é mantida; as seguintes descartadas como 'repetida_no_fundo'.
    O cache é persistente por fundo e acumula entre docs.
    """
    for img in imagens:
        if img.descartar:
            continue
        h = img.hash_perceptual
        if h in cache_fundo:
            entry = cache_fundo[h]
            entry["vezes"] = entry.get("vezes", 1) + 1
            # Segunda e seguintes: descarta, pois não traz info nova
            img.descartar = True
            img.motivo_descarte = f"repetida_no_fundo_{entry['vezes']}x"
        else:
            cache_fundo[h] = {"primeira_vez": datetime.now().isoformat(), "vezes": 1}


# ---------------------------------------------------------------------------
# Extração PDF com posicionamento
# ---------------------------------------------------------------------------

def _extrair_pdf_com_imagens(arquivo: Path, pasta_img_out: Path) -> tuple[str, list[AnaliseImagem]]:
    """Extrai Markdown preservando ordem texto↔imagem, e lista de imagens com metadata."""
    import fitz
    from PIL import Image
    import imagehash
    import io

    doc = fitz.open(arquivo)
    partes_md: list[str] = []
    imagens: list[AnaliseImagem] = []
    img_refs_emitidas: set[tuple[int, int]] = set()  # (pagina, xref)

    for npag, page in enumerate(doc, start=1):
        partes_md.append(f"\n\n<!-- página {npag} -->\n")

        # Lista de imagens da página com xref (indexada pelo `number`)
        imgs_pag = page.get_images(full=True)  # tuplas; [0] é xref

        # Blocos em ordem natural (pymupdf ordena top→bottom)
        blocks = page.get_text("dict", sort=True).get("blocks", [])

        # v1.1: constrói índice espacial de blocos de texto para detectar
        # "texto sobreposto a imagem" (valores+labels dentro de gráfico)
        blocos_texto_da_pagina: list[dict] = []
        for b in blocks:
            if b.get("type") != 0:
                continue
            tbbox = b.get("bbox", (0, 0, 0, 0))
            tt = " ".join(
                "".join(s.get("text", "") for s in ln.get("spans", []))
                for ln in b.get("lines", [])
            ).strip()
            if tt:
                blocos_texto_da_pagina.append({"bbox": tbbox, "texto": tt})
        for bloco in blocks:
            btype = bloco.get("type")  # 0=texto, 1=imagem
            bbox = bloco.get("bbox", (0, 0, 0, 0))

            if btype == 0:  # texto
                # Junta spans dentro da mesma linha com espaço; linhas com \n
                linhas = []
                for linha in bloco.get("lines", []):
                    spans = linha.get("spans", [])
                    trecho = "".join(s.get("text", "") for s in spans).strip()
                    if trecho:
                        linhas.append(trecho)
                if linhas:
                    # Heurística: se o bloco tem poucas linhas e linhas curtas,
                    # é parágrafo fragmentado — une com espaço. Se é lista ou tabela,
                    # preserva quebras.
                    media = sum(len(l) for l in linhas) / len(linhas)
                    if len(linhas) > 1 and media < 50:
                        # Provável fragmentação de coluna/margem — une com espaço
                        texto_bloco = " ".join(linhas)
                    else:
                        texto_bloco = "\n".join(linhas)
                    partes_md.append(texto_bloco)

            elif btype == 1:  # imagem
                # Mapeia bloco → xref via bbox (mais preciso que `number`)
                number = bloco.get("number", -1)
                xref = None
                # Tenta pelo rect: pode haver múltiplas imagens, achar a que cobre o bbox
                for img in imgs_pag:
                    xref_candidato = img[0]
                    try:
                        rects = page.get_image_rects(xref_candidato)
                    except Exception:
                        rects = []
                    for r in rects:
                        # bbox do bloco bate com rect da imagem?
                        if (abs(r.x0 - bbox[0]) < 2 and abs(r.y0 - bbox[1]) < 2
                                and abs(r.x1 - bbox[2]) < 2 and abs(r.y1 - bbox[3]) < 2):
                            xref = xref_candidato
                            break
                    if xref:
                        break
                # Fallback: usa xref do índice `number` se válido
                if xref is None and 0 <= number < len(imgs_pag):
                    xref = imgs_pag[number][0]

                if xref is None:
                    continue

                chave = (npag, xref)
                if chave in img_refs_emitidas:
                    continue
                img_refs_emitidas.add(chave)

                try:
                    img_info = doc.extract_image(xref)
                except Exception:
                    continue
                raw = img_info["image"]
                try:
                    img_pil = Image.open(io.BytesIO(raw))
                except Exception:
                    continue

                md5 = hashlib.md5(raw).hexdigest()
                try:
                    ph = str(imagehash.phash(img_pil, hash_size=PHASH_SIZE))
                except Exception:
                    ph = md5  # fallback

                ai = AnaliseImagem(
                    xref=xref,
                    pagina=npag,
                    bbox=bbox,
                    largura=img_info.get("width", 0),
                    altura=img_info.get("height", 0),
                    bytes_size=len(raw),
                    hash_perceptual=ph,
                    hash_md5=md5,
                    formato=img_info.get("ext", "?"),
                )
                triagem_heuristica(ai, img_pil)

                # v1.1: se a imagem passou na triagem, checa se é candidata
                # a refinamento manual (revisão minha no chat).
                if not ai.descartar:
                    area_px = ai.largura * ai.altura

                    # Critério 1: texto DENTRO da bbox da imagem (gráficos com labels embutidos)
                    x0, y0, x1, y1 = bbox
                    blocos_dentro = [
                        bt for bt in blocos_texto_da_pagina
                        if bt["bbox"][0] >= x0 - 2 and bt["bbox"][2] <= x1 + 2
                        and bt["bbox"][1] >= y0 - 2 and bt["bbox"][3] <= y1 + 2
                    ]
                    # Conta blocos com número (filtra agendas/sumários decorativos)
                    blocos_com_numero = [
                        bt for bt in blocos_dentro
                        if re.search(r"\d[\d.,]*\s*(%|MI|R\$|mi|mil)?", bt["texto"])
                    ]

                    motivo = None
                    if len(blocos_dentro) >= 4 and len(blocos_com_numero) >= 2:
                        motivo = f"texto_sobreposto ({len(blocos_dentro)} blocos, {len(blocos_com_numero)} com números)"
                    # Critério 2: imagem "grande" (≥100k pixels) em posição isolada —
                    # provavelmente gráfico standalone (treemap, donut, mapa) com labels próximos
                    elif area_px >= 100_000 and ai.largura >= 300 and ai.altura >= 200:
                        # checa se a imagem ocupa região significativa da página
                        # (não é um carrossel de fotos de ativos)
                        page_rect = page.rect
                        frac_pagina = (
                            (x1 - x0) * (y1 - y0) / (page_rect.width * page_rect.height)
                            if page_rect.width and page_rect.height else 0
                        )
                        if frac_pagina >= 0.15:  # ocupa ≥15% da página
                            motivo = f"imagem_grande ({ai.largura}x{ai.altura}, {frac_pagina*100:.0f}% página)"

                    if motivo:
                        ai.candidata_refinamento = True
                        ai.texto_sobreposto_amostra = [
                            f"[{motivo}]",
                        ] + [bt["texto"][:120] for bt in blocos_dentro[:10]]

                imagens.append(ai)

                # Marker no markdown na posição onde a imagem aparece
                # (será substituído depois por texto útil ou removido)
                partes_md.append(f"\n<<IMG:{npag}:{xref}>>\n")

                # Se passou triagem, salva arquivo de imagem
                if not ai.descartar:
                    pasta_img_out.mkdir(parents=True, exist_ok=True)
                    dst = pasta_img_out / f"p{npag:03d}_x{xref}.{ai.formato}"
                    dst.write_bytes(raw)

    doc.close()
    return "\n".join(partes_md), imagens


# ---------------------------------------------------------------------------
# Extração HTML estruturado (delegada ao extrair.py existente — reusa a função)
# ---------------------------------------------------------------------------

def _extrair_html_texto(arquivo: Path) -> str:
    from extrair import _html_to_text
    return _html_to_text(arquivo.read_text(encoding="utf-8", errors="replace"))


# ---------------------------------------------------------------------------
# Classificador vision (Haiku 4.5 via API)
# ---------------------------------------------------------------------------

SYSTEM_VISION = """Você recebe UMA imagem extraída de um documento oficial de FII brasileiro. Classifique e, se informativa, extraia os dados.

Responda JSON estrito:
{
  "tipo": "grafico" | "tabela" | "mapa" | "foto_imovel" | "foto_generica" | "logo" | "ornamental" | "fluxograma" | "outro",
  "informativa": true | false,
  "descricao": "1 linha curta descrevendo o que é",
  "dados_extraidos_markdown": "se for gráfico/tabela/mapa com dados, extraia em Markdown (tabela ou lista). Preserve todos os números/labels visíveis. Se não aplica, use null."
}

Regras:
- "informativa" = true apenas se a imagem carrega dados/informação relevante (gráfico com números, tabela, mapa de localização com nomes, foto de imóvel com legenda, fluxograma).
- "informativa" = false para logos, banners decorativos, fotos genéricas sem legenda, ícones, imagens ornamentais.
- Em "dados_extraidos_markdown" preserve TODOS os valores numéricos visíveis. Para gráficos de barra, liste cada barra com seu valor. Para pizza, liste cada fatia com %.
- Seja CONCISO. Não explique, só extraia."""


def classificar_imagens_vision(imagens_candidatas: list[tuple[AnaliseImagem, bytes]],
                               cache_vision: dict) -> None:
    """Para cada imagem candidata, chama Haiku 4.5 vision. Popula ai.classificacao_vision.

    cache_vision é um dict {hash_perceptual: classificacao} que sobrevive entre docs.
    """
    try:
        from anthropic import Anthropic
    except ImportError:
        return

    if not os.environ.get("ANTHROPIC_API_KEY"):
        return

    client = Anthropic()
    for ai, raw in imagens_candidatas:
        if ai.hash_perceptual in cache_vision:
            ai.classificacao_vision = cache_vision[ai.hash_perceptual]
            continue
        try:
            b64 = base64.b64encode(raw).decode("ascii")
            media_type = f"image/{ai.formato if ai.formato != 'jpg' else 'jpeg'}"
            msg = client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=2048,
                system=SYSTEM_VISION,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "base64",
                                                     "media_type": media_type,
                                                     "data": b64}},
                        {"type": "text", "text": "Classifique esta imagem. Responda APENAS com JSON."},
                    ],
                }],
            )
            txt = msg.content[0].text if msg.content else ""
            m = re.search(r"\{.*\}", txt, re.DOTALL)
            parsed = json.loads(m.group(0)) if m else {}
            ai.classificacao_vision = parsed
            cache_vision[ai.hash_perceptual] = parsed

            # Se a IA classificou como não-informativa, marca descarte
            if not parsed.get("informativa"):
                ai.descartar = True
                ai.motivo_descarte = f"vision_{parsed.get('tipo','nao_informativa')}"
        except Exception as e:
            ai.classificacao_vision = {"erro": str(e)[:150]}


# ---------------------------------------------------------------------------
# Reconstrução do Markdown
# ---------------------------------------------------------------------------

def reconstruir_md(md_raw: str, imagens: list[AnaliseImagem]) -> str:
    """Substitui marcadores <<IMG:...>> por blocos úteis (dados da imagem) ou remove."""
    imgs_by_key = {(i.pagina, i.xref): i for i in imagens}

    def _substituir(m):
        pagina = int(m.group(1))
        xref = int(m.group(2))
        ai = imgs_by_key.get((pagina, xref))
        if ai is None or ai.descartar:
            return ""  # remove marcador
        cv = ai.classificacao_vision or {}
        tipo = cv.get("tipo", "imagem")
        desc = cv.get("descricao", f"imagem {tipo}")
        dados = cv.get("dados_extraidos_markdown")
        bloco = f"\n\n![{tipo.upper()}: {desc}](imagens/p{pagina:03d}_x{xref}.{ai.formato})\n"
        if dados:
            bloco += f"\n{dados}\n"
        return bloco

    md = re.sub(r"<<IMG:(\d+):(\d+)>>", _substituir, md_raw)

    # Limpa linhas duplicadas + espaços excessivos
    md = re.sub(r"\n{3,}", "\n\n", md)
    md = re.sub(r"[ \t]+\n", "\n", md)
    return md.strip()


# ---------------------------------------------------------------------------
# Processar um doc
# ---------------------------------------------------------------------------

@dataclass
class Resultado:
    id: str
    tipo: str
    bytes_original: int
    bytes_otimizado: int
    imagens_brutas: int
    imagens_relevantes: int
    imagens_descartadas: int
    razoes_descarte: dict = field(default_factory=dict)
    paginas: int = 0
    classificacao_doc: str = ""


def processar_documento(ticker: str, doc_meta: dict,
                        arquivo: Path, pasta_out: Path,
                        cache_phash: CacheHashFundo,
                        cache_vision: dict,
                        usar_vision: bool) -> Resultado:
    did = str(doc_meta["id"])
    tipo_doc = doc_meta.get("tipoDocumento") or "?"
    pasta_img_out = pasta_out / "imagens" / did

    classificacao = classificar_documento(arquivo, tipo_doc)

    imagens: list[AnaliseImagem] = []
    paginas = 0

    if classificacao == "html_estruturado":
        md_final = _extrair_html_texto(arquivo)
    elif classificacao == "pdf_imagem":
        # Caso especial: PDF com texto em paths/imagens — nem pymupdf nem
        # pdftotext extraem. Renderizamos cada página como PNG e marcamos
        # como candidatas de refinamento para leitura manual no chat.
        pasta_paginas = pasta_out / "imagens" / did / "paginas"
        paginas_md = _renderizar_paginas_como_imagens(arquivo, pasta_paginas)
        # Cada página vira uma "imagem" candidata no meta
        for p in paginas_md:
            md5 = hashlib.md5((p["arquivo"] + did).encode()).hexdigest()
            imagens.append(AnaliseImagem(
                xref=-p["pagina"],  # negativo para distinguir de xref real
                pagina=p["pagina"],
                bbox=(0, 0, p["largura"], p["altura"]),
                largura=p["largura"],
                altura=p["altura"],
                bytes_size=p["bytes_size"],
                hash_perceptual=md5[:16],
                hash_md5=md5,
                formato="png",
                candidata_refinamento=True,
                texto_sobreposto_amostra=[f"[pdf_imagem — página {p['pagina']} renderizada para revisão]"],
            ))
        # Markdown mínimo com placeholders para cada página
        partes = [f"\n\n<!-- página {p['pagina']} (pdf_imagem — requer refinamento manual) -->\n"
                  f"![PAGINA_IMAGEM: página {p['pagina']}](imagens/{did}/paginas/{p['arquivo']})\n"
                  for p in paginas_md]
        md_final = "".join(partes)
        # Conta páginas
        try:
            import fitz
            d = fitz.open(arquivo)
            paginas = len(d)
            d.close()
        except Exception:
            paginas = len(paginas_md)
    elif classificacao == "pdf_texto":
        md_raw, imagens = _extrair_pdf_com_imagens(arquivo, pasta_img_out)
        # Triagem heurística já aplicada dentro de _extrair_pdf_com_imagens
        # Agora: triagem por repetição entre docs do mesmo fundo
        triagem_repetidas(imagens, cache_phash)

        # Vision opcional para pdf_texto (sem efeito sem API)
        if usar_vision:
            sobreviventes: list[tuple[AnaliseImagem, bytes]] = []
            for ai in imagens:
                if ai.descartar:
                    continue
                arq_img = pasta_img_out / f"p{ai.pagina:03d}_x{ai.xref}.{ai.formato}"
                if arq_img.exists():
                    sobreviventes.append((ai, arq_img.read_bytes()))
            if sobreviventes:
                classificar_imagens_vision(sobreviventes, cache_vision)

        md_final = reconstruir_md(md_raw, imagens)
        for ai in imagens:
            if ai.descartar:
                for candidato in pasta_img_out.glob(f"p{ai.pagina:03d}_x{ai.xref}.*"):
                    candidato.unlink(missing_ok=True)

        # Conta páginas
        try:
            import fitz
            d = fitz.open(arquivo)
            paginas = len(d)
            d.close()
        except Exception:
            paginas = 0
    else:
        md_final = arquivo.read_text(encoding="utf-8", errors="replace")[:100_000]

    # Se não sobraram imagens, remove a pasta
    if pasta_img_out.exists() and not any(pasta_img_out.iterdir()):
        pasta_img_out.rmdir()

    # Escreve .md + .meta.json
    saida_md = pasta_out / f"{did}.md"
    saida_md.parent.mkdir(parents=True, exist_ok=True)

    header = [
        f"# {tipo_doc}",
        f"Ticker: {ticker}",
        f"Data de referência: {doc_meta.get('dataReferencia', '?')}",
        f"Data de entrega: {doc_meta.get('dataEntrega', '?')}",
        f"ID Fundos.NET: {did}",
        "",
    ]
    saida_md.write_text("\n".join(header) + "\n" + md_final, encoding="utf-8")

    razoes = {}
    for ai in imagens:
        if ai.descartar:
            razoes[ai.motivo_descarte] = razoes.get(ai.motivo_descarte, 0) + 1

    imgs_relevantes = [ai for ai in imagens if not ai.descartar]

    meta_out = {
        "id": did,
        "tipo": tipo_doc,
        "ticker": ticker,
        "classificacao_doc": classificacao,
        "paginas": paginas,
        "bytes_original": arquivo.stat().st_size,
        "bytes_otimizado": saida_md.stat().st_size,
        "reducao_percentual": round(100 * (1 - saida_md.stat().st_size / max(1, arquivo.stat().st_size)), 1),
        "imagens_brutas": len(imagens),
        "imagens_relevantes": len(imgs_relevantes),
        "imagens_descartadas": sum(1 for ai in imagens if ai.descartar),
        "imagens_candidatas_refinamento": sum(1 for ai in imgs_relevantes if ai.candidata_refinamento),
        "razoes_descarte": razoes,
        "imagens_mantidas": [
            {
                "arquivo": f"imagens/{did}/p{ai.pagina:03d}_x{ai.xref}.{ai.formato}",
                "pagina": ai.pagina,
                "largura": ai.largura,
                "altura": ai.altura,
                "hash_perceptual": ai.hash_perceptual,
                "candidata_refinamento": ai.candidata_refinamento,
                "texto_sobreposto_amostra": ai.texto_sobreposto_amostra,
                "classificacao_vision": ai.classificacao_vision,
            }
            for ai in imgs_relevantes
        ],
        "otimizador_versao": "1.3",
        "otimizadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (pasta_out / f"{did}.meta.json").write_text(
        json.dumps(meta_out, ensure_ascii=False, indent=2), encoding="utf-8")

    return Resultado(
        id=did, tipo=tipo_doc,
        bytes_original=arquivo.stat().st_size,
        bytes_otimizado=saida_md.stat().st_size,
        imagens_brutas=len(imagens),
        imagens_relevantes=len(imgs_relevantes),
        imagens_descartadas=sum(1 for ai in imagens if ai.descartar),
        razoes_descarte=razoes,
        paginas=paginas,
        classificacao_doc=classificacao,
    )


# ---------------------------------------------------------------------------
# Orquestração por ticker
# ---------------------------------------------------------------------------

def processar_ticker(ticker: str, apenas_doc: Optional[str] = None,
                     usar_vision: bool = True, workers: int = 2) -> dict:
    ticker = ticker.upper()
    pasta_raw = FIIS_RAW / ticker
    pasta_out = FIIS_OPTIMIZED / ticker
    pasta_out.mkdir(parents=True, exist_ok=True)

    meta = json.loads((pasta_raw / "meta.json").read_text(encoding="utf-8"))
    docs = meta.get("documentos", [])
    if apenas_doc:
        docs = [d for d in docs if str(d["id"]) == str(apenas_doc)]

    print(f"[otimizar] {ticker}: {len(docs)} docs, vision={'on' if usar_vision and os.environ.get('ANTHROPIC_API_KEY') else 'off'}, workers={workers}")

    # Caches por fundo
    cache_phash: CacheHashFundo = {}
    cache_vision: dict = {}

    # Carrega cache anterior se existir (idempotência)
    cache_path = pasta_out / "_caches.json"
    if cache_path.exists():
        try:
            c = json.loads(cache_path.read_text(encoding="utf-8"))
            cache_phash = c.get("phash", {})
            cache_vision = c.get("vision", {})
        except Exception:
            pass

    resultados: list[Resultado] = []
    inicio = time.time()

    # Processa docs. Imagens dentro de 1 doc são processadas paralelamente via vision,
    # mas os docs em si são sequenciais porque compartilham caches (integridade).
    for i, d in enumerate(docs, start=1):
        arquivo = pasta_raw / d["arquivo"]
        if not arquivo.exists():
            continue
        meta_out_path = pasta_out / f"{d['id']}.meta.json"
        if meta_out_path.exists() and not apenas_doc:
            # Já otimizado, pula (idempotência)
            continue
        try:
            r = processar_documento(ticker, d, arquivo, pasta_out,
                                    cache_phash, cache_vision, usar_vision)
            resultados.append(r)
            print(f"  [{i:3d}/{len(docs)}] {d['id']:>8} {d.get('tipoDocumento','?')[:30]:30s} "
                  f"{r.classificacao_doc:12s} "
                  f"{r.bytes_original//1024:5d}KB→{r.bytes_otimizado//1024:5d}KB "
                  f"(-{100*(1-r.bytes_otimizado/max(1,r.bytes_original)):.0f}%) "
                  f"imgs={r.imagens_brutas}→{r.imagens_relevantes}")
        except Exception as e:
            print(f"  [erro] {d['id']}: {e}")

    # Persiste caches
    cache_path.write_text(json.dumps({
        "phash": cache_phash, "vision": cache_vision,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    dt = time.time() - inicio

    total_orig = sum(r.bytes_original for r in resultados)
    total_otim = sum(r.bytes_otimizado for r in resultados)
    total_imgs_brutas = sum(r.imagens_brutas for r in resultados)
    total_imgs_mantidas = sum(r.imagens_relevantes for r in resultados)

    sumario = {
        "ticker": ticker,
        "docs_processados": len(resultados),
        "total_bytes_original": total_orig,
        "total_bytes_otimizado": total_otim,
        "reducao_total_pct": round(100 * (1 - total_otim / max(1, total_orig)), 1),
        "imagens_brutas": total_imgs_brutas,
        "imagens_mantidas": total_imgs_mantidas,
        "imagens_descartadas": total_imgs_brutas - total_imgs_mantidas,
        "duracao_s": round(dt, 1),
        "vision_ativo": usar_vision and bool(os.environ.get("ANTHROPIC_API_KEY")),
    }
    (pasta_out / "_sumario.json").write_text(
        json.dumps(sumario, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n[ok] {ticker}: {total_orig/1e6:.1f}MB → {total_otim/1e6:.1f}MB "
          f"({sumario['reducao_total_pct']}% redução), "
          f"imagens {total_imgs_brutas}→{total_imgs_mantidas}, {dt:.0f}s")
    return sumario


def main() -> int:
    ap = argparse.ArgumentParser(description="Otimiza documentos minerados")
    ap.add_argument("ticker")
    ap.add_argument("--doc", help="Apenas um doc específico (id)")
    ap.add_argument("--sem-vision", action="store_true", help="Só heurística, sem API")
    ap.add_argument("--workers", type=int, default=2)
    args = ap.parse_args()

    processar_ticker(args.ticker, apenas_doc=args.doc,
                     usar_vision=not args.sem_vision,
                     workers=args.workers)
    return 0


if __name__ == "__main__":
    sys.exit(main())
