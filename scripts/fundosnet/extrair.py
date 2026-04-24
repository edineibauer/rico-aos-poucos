"""Extração determinística dos documentos minerados.

Lê data/fiis-raw/{TICKER}/ e produz:
  data/fiis-extracted/{TICKER}/
    metadata.json            # ticker, cnpj, periodo, totais
    indicadores-series.json  # série temporal de todos indicadores dos Informes estruturados
    dividendos.json          # rendimentos — data_base, data_pagamento, valor, tipo
    textos/{id}.txt          # texto limpo dos PDFs/HTMLs narrativos
    index-textos.json        # lista de docs textuais com metadata + caminho

Sem LLM. Só parsers determinísticos + pdftotext.

Uso:
  python3 extrair.py HGLG11
  python3 extrair.py --todos     # todos em data/fiis-raw/
"""
from __future__ import annotations

import argparse
import html as html_mod
import json
import re
import subprocess
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from paths import DATA

FIIS_RAW = DATA / "fiis-raw"
FIIS_EXTRACTED = DATA / "fiis-extracted"


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def _html_to_text(html: str) -> str:
    """Converte HTML em texto preservando estrutura tabular quando houver."""
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return _html_to_text_regex(html)

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "head"]):
        tag.decompose()

    linhas: list[str] = []

    def walk(elem, depth=0):
        if isinstance(elem, str):
            t = elem.strip()
            if t:
                linhas.append(t)
            return
        name = getattr(elem, "name", None)
        if name in ("br", "hr"):
            linhas.append("")
            return
        if name == "tr":
            cells = []
            for td in elem.find_all(["td", "th"], recursive=False):
                txt = " ".join(td.get_text(" ", strip=True).split())
                cells.append(txt)
            linha = " | ".join(c for c in cells if c)
            if linha:
                linhas.append(linha)
            return
        if name == "table":
            linhas.append("")
            for child in elem.children:
                walk(child, depth + 1)
            linhas.append("")
            return
        if name in ("p", "div", "li", "h1", "h2", "h3", "h4"):
            for child in elem.children:
                walk(child, depth + 1)
            linhas.append("")
            return
        for child in getattr(elem, "children", []):
            walk(child, depth + 1)

    walk(soup.body or soup)

    out: list[str] = []
    for l in linhas:
        l = l.strip()
        if not l:
            if out and out[-1] != "":
                out.append("")
        else:
            out.append(l)
    while out and out[-1] == "":
        out.pop()
    return "\n".join(out)


def _html_to_text_regex(html: str) -> str:
    s = html
    s = re.sub(r"<script.*?</script>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<style.*?</style>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</tr\s*>", "\n", s, flags=re.I)
    s = re.sub(r"</p\s*>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html_mod.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n[ \t]+", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def _num(s: str | None) -> float | None:
    if s is None:
        return None
    s = str(s).strip()
    s = s.replace("R$", "").replace("%", "").strip()
    # padrão BR: 1.234,56 → 1234.56
    # padrão EN: 1,234.56 → 1234.56
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        s = s.replace(".", "").replace(",", ".")
    s = re.sub(r"[^\d.\-]", "", s)
    try:
        return float(s)
    except Exception:
        return None


def _parse_date_br(s: str | None) -> str | None:
    """Aceita dd/mm/YYYY, dd/mm/YYYY HH:MM, YYYY-MM-DD. Retorna YYYY-MM-DD."""
    if not s:
        return None
    s = s.strip()
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d", "%m/%Y"):
        try:
            dt = datetime.strptime(s[:19 if len(s) > 10 else len(s)], fmt)
            return dt.date().isoformat()
        except ValueError:
            continue
    # Informes mensais vêm como "12/2024" ou "MM/YYYY"
    m = re.match(r"^(\d{1,2})/(\d{4})$", s)
    if m:
        return f"{m.group(2)}-{int(m.group(1)):02d}-01"
    return None


def _pdftotext(path: Path, layout: bool = False) -> str:
    try:
        args = ["pdftotext"]
        if layout:
            args.append("-layout")
        args += ["-q", str(path), "-"]
        r = subprocess.run(args, capture_output=True, timeout=120)
        return r.stdout.decode("utf-8", errors="replace")
    except Exception as e:
        return f"[erro pdftotext: {e}]"


# ---------------------------------------------------------------------------
# Parsers de HTMLs estruturados CVM
# ---------------------------------------------------------------------------

# Esses HTMLs têm pares "titulo-dado" / "dado-cabecalho" em tabelas.
# Capturamos todos os pares e depois mapeamos os rótulos conhecidos.

_CELL_RX = re.compile(
    r'<td[^>]*>\s*<span[^>]*class="([^"]*)"[^>]*>(.*?)</span>\s*</td>',
    re.DOTALL | re.IGNORECASE,
)


def _parse_form_cvm(html: str) -> dict:
    """Extrai pares titulo→valor de formulários HTML CVM."""
    text = html
    pares: list[tuple[str, str]] = []
    # Extrai pares ordenados (rótulo em titulo-dado, valor em dado-cabecalho ou dado-valores)
    items: list[tuple[str, str]] = []
    for m in _CELL_RX.finditer(text):
        cls = m.group(1).lower()
        val = html_mod.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip()
        items.append((cls, val))
    # Monta pares: cada titulo-dado emparelha com o próximo dado-cabecalho/dado-valores
    i = 0
    while i < len(items):
        if "titulo-dado" in items[i][0]:
            rotulo = items[i][1].rstrip(":").strip()
            # procura o próximo dado
            j = i + 1
            while j < len(items) and "titulo-dado" in items[j][0]:
                j += 1
            if j < len(items):
                pares.append((rotulo, items[j][1]))
                i = j + 1
                continue
        i += 1
    return dict(pares)


# Mapeamento rótulo → campo canônico (normalizado)
MAPEAMENTO_INFORME = {
    # Identificação
    "nome do fundo": "nome_fundo",
    "cnpj do fundo": "cnpj",
    "data de funcionamento": "data_funcionamento",
    "quantidade de cotas emitidas": "cotas_emitidas",
    "código isin": "isin",
    # Indicadores mensais / trimestrais / anuais
    "valor patrimonial por cota": "vp_cota",
    "valor patrimonial da cota": "vp_cota",
    "número de cotistas": "cotistas",
    "número de cotistas – total": "cotistas",
    "patrimônio líquido": "patrimonio_liquido",
    "rendimento por cota": "rendimento_cota",
    "total de ativos": "ativos_totais",
    "total do ativo": "ativos_totais",
    "total de passivo": "passivo_total",
    "patrimônio do fundo": "patrimonio_liquido",
    "quantidade de cotas": "cotas_emitidas",
    "quantidade de cotistas": "cotistas",
    # Período / competência
    "mês de competência": "competencia",
    "trimestre de competência": "competencia",
    "ano de competência": "competencia",
    "mês de referência": "competencia",
    "trimestre de referência": "competencia",
    "ano de referência": "competencia",
    "data de referência": "data_referencia",
    # Distribuições
    "quantidade de cotistas com rendimento distribuído no mês": "cotistas_com_rendimento",
    # Resultado
    "receita total": "receita_total",
    "despesa total": "despesa_total",
    "resultado líquido": "resultado_liquido",
    "resultado no período": "resultado_liquido",
    "distribuição de rendimentos": "distribuicao_rendimentos",
}


def _normalize_key(k: str) -> str:
    return k.lower().strip().rstrip(":").replace("  ", " ")


def parse_informe_estruturado(html: str, tipo: str, data_ref: str | None) -> dict:
    pares = _parse_form_cvm(html)
    # Também tenta capturar TODOS os pares visíveis, não apenas o mapeamento canônico
    dados: dict = {"tipo_informe": tipo}
    for k, v in pares.items():
        ck = _normalize_key(k)
        if ck in MAPEAMENTO_INFORME:
            campo = MAPEAMENTO_INFORME[ck]
            num = _num(v)
            dados[campo] = num if num is not None and not isinstance(dados.get(campo), str) else v
        else:
            dados[f"_raw.{ck}"] = v
    if data_ref and "data_referencia" not in dados:
        dados["data_referencia"] = _parse_date_br(data_ref) or data_ref
    return dados


def parse_rendimento(html: str, data_ref: str | None) -> dict:
    """Extrai data_base, data_pagamento, valor_cota, tipo de provento.

    O HTML da CVM tem formato tabelar. Faz 3 varreduras:
    1) Varre todas as <td>: pega dados via proximidade rótulo→valor.
    2) Regex direto no texto limpo.
    3) Fallback via _parse_form_cvm original.
    """
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")

    r: dict = {}

    # 1) Varre linhas de <tr> — cada tr tem rótulos em td e valores em tds adjacentes
    def _find_value_after(rotulos: list[str]) -> str | None:
        for tr in soup.find_all("tr"):
            tds = tr.find_all(["td", "th"])
            for i, td in enumerate(tds):
                txt = td.get_text(" ", strip=True).lower().rstrip(":")
                for rot in rotulos:
                    if rot in txt:
                        # Próximo td na mesma linha
                        if i + 1 < len(tds):
                            v = tds[i + 1].get_text(" ", strip=True)
                            if v:
                                return v
        return None

    v = _find_value_after(["data-base", "data base"])
    if v:
        r["data_base"] = _parse_date_br(v)

    v = _find_value_after(["data do pagamento", "data de pagamento"])
    if v:
        r["data_pagamento"] = _parse_date_br(v)

    v = _find_value_after([
        "valor do provento", "valor do rendimento", "valor por cota",
        "rendimento por cota", "valor total do provento",
    ])
    if v:
        r["valor_cota"] = _num(v)

    v = _find_value_after(["tipo de rendimento", "tipo do rendimento",
                           "tipo do provento", "tipo de provento", "tipo de ativo"])
    if v:
        r["tipo"] = v

    v = _find_value_after(["periodicidade"])
    if v:
        r["periodicidade"] = v

    v = _find_value_after(["data da informação", "data de aprovação", "data da aprovação"])
    if v:
        r["data_aprovacao"] = _parse_date_br(v)

    # 2) Fallback regex no texto limpo
    if "valor_cota" not in r or r["valor_cota"] is None:
        text = _html_to_text(html)
        m = re.search(r"valor\s+(?:do\s+)?(?:rendimento|provento|por\s+cota)[^\n]*?R?\$?\s*([\d.,]+)",
                      text, re.I)
        if m:
            r["valor_cota"] = _num(m.group(1))

    if "data_base" not in r or not r["data_base"]:
        text = _html_to_text(html)
        m = re.search(r"data[- ]?base[^\n]*?(\d{2}/\d{2}/\d{4})", text, re.I)
        if m:
            r["data_base"] = _parse_date_br(m.group(1))

    if data_ref:
        r.setdefault("data_referencia", _parse_date_br(data_ref) or data_ref)
    return r


# ---------------------------------------------------------------------------
# Processar um ticker
# ---------------------------------------------------------------------------

TIPOS_ESTRUTURADOS = ["informe mensal estruturado", "informe trimestral estruturado",
                      "informe anual estruturado"]
TIPOS_RENDIMENTO = ["rendimentos e amortizações", "rendimentos e amortiza"]
TIPOS_PDF_NARRATIVOS = [
    "relatório gerencial", "relatorio gerencial",
    "fato relevante", "comunicado ao mercado",
    "outros comunicados não considerados fatos relevantes",
    "convocação", "convocacao", "assembleia", "assembléia",
    "demonstrações financeiras", "demonstracoes financeiras",
    "esclarecimentos de consulta", "instrumento particular de alteração",
    "perfil do fundo", "prospecto",
]


def _tipo_bucket(tipo: str) -> str:
    t = (tipo or "").lower()
    if any(x in t for x in TIPOS_RENDIMENTO):
        return "rendimento"
    for marker in TIPOS_ESTRUTURADOS:
        if marker in t:
            return "estruturado"
    for marker in TIPOS_PDF_NARRATIVOS:
        if marker in t:
            return "narrativo"
    return "outro"


def processar_ticker(ticker: str) -> dict:
    ticker = ticker.upper()
    pasta_raw = FIIS_RAW / ticker
    pasta_out = FIIS_EXTRACTED / ticker
    pasta_out.mkdir(parents=True, exist_ok=True)
    (pasta_out / "textos").mkdir(exist_ok=True)

    meta = json.loads((pasta_raw / "meta.json").read_text(encoding="utf-8"))

    indicadores_series: list[dict] = []
    dividendos: list[dict] = []
    textos_index: list[dict] = []

    contadores = defaultdict(int)
    erros = 0

    for doc in meta.get("documentos", []):
        did = str(doc["id"])
        arquivo = pasta_raw / doc["arquivo"]
        if not arquivo.exists():
            erros += 1
            continue

        tipo = (doc.get("tipoDocumento") or "").strip()
        bucket = _tipo_bucket(tipo)
        data_ref = doc.get("dataReferencia") or doc.get("dataEntrega")
        formato = doc.get("formato") or arquivo.suffix.lstrip(".")
        contadores[bucket] += 1

        try:
            # Rendimentos: parser específico — vira série temporal
            if bucket == "rendimento" and formato == "html":
                html = arquivo.read_text(encoding="utf-8", errors="replace")
                dados = parse_rendimento(html, data_ref)
                dados["_id"] = did
                dividendos.append(dados)
                continue

            # Tudo o resto (narrativo + estruturado): texto limpo para LLM
            if formato == "pdf":
                texto = _pdftotext(arquivo, layout=False)
            else:
                texto = _html_to_text(arquivo.read_text(encoding="utf-8", errors="replace"))
            texto = texto.strip()

            # Para Informes Estruturados, guarda também um apontamento na série de indicadores
            # (o valor detalhado o LLM tira do próprio texto)
            if bucket == "estruturado":
                indicadores_series.append({
                    "_id": did,
                    "_tipo": tipo,
                    "data_referencia": _parse_date_br(data_ref) or data_ref,
                    "arquivo_texto": f"textos/{did}.txt",
                })

            if texto:
                (pasta_out / "textos" / f"{did}.txt").write_text(texto, encoding="utf-8")
                textos_index.append({
                    "id": did,
                    "tipo": tipo,
                    "dataReferencia": doc.get("dataReferencia"),
                    "dataEntrega": doc.get("dataEntrega"),
                    "formato": formato,
                    "arquivo": f"textos/{did}.txt",
                    "bytes": len(texto.encode("utf-8")),
                    "bucket": bucket,
                })
        except Exception as e:
            erros += 1
            print(f"  [erro] doc {did} ({tipo}): {e}")

    # Ordena séries por data
    def _sort_dt(x: dict) -> str:
        return x.get("data_referencia") or x.get("competencia") or ""
    indicadores_series.sort(key=_sort_dt)
    dividendos.sort(key=lambda d: d.get("data_base") or d.get("data_referencia") or "")
    textos_index.sort(key=lambda d: d.get("dataEntrega") or "")

    metadata = {
        "ticker": ticker,
        "cnpj": meta.get("cnpj"),
        "nomePregao": meta.get("nomePregao"),
        "descricaoFundo": meta.get("descricaoFundo"),
        "totalDocumentos": meta.get("totalDocumentos"),
        "distribuicao": dict(contadores),
        "erros": erros,
        "extraidoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "periodo": {
            "inicio": (textos_index[0]["dataEntrega"] if textos_index else None),
            "fim": (textos_index[-1]["dataEntrega"] if textos_index else None),
        },
    }

    (pasta_out / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (pasta_out / "indicadores-series.json").write_text(
        json.dumps(indicadores_series, ensure_ascii=False, indent=2), encoding="utf-8")
    (pasta_out / "dividendos.json").write_text(
        json.dumps(dividendos, ensure_ascii=False, indent=2), encoding="utf-8")
    (pasta_out / "index-textos.json").write_text(
        json.dumps(textos_index, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"  [ok] {ticker}: {len(indicadores_series)} indicadores, "
          f"{len(dividendos)} rendimentos, {len(textos_index)} textos, {erros} erros")
    return metadata


def main() -> int:
    ap = argparse.ArgumentParser(description="Extrai dados determinísticos de data/fiis-raw/")
    ap.add_argument("ticker", nargs="?")
    ap.add_argument("--todos", action="store_true")
    args = ap.parse_args()

    if args.todos:
        for d in sorted(FIIS_RAW.iterdir()):
            if d.is_dir() and (d / "meta.json").exists():
                try:
                    processar_ticker(d.name)
                except Exception as e:
                    print(f"  [falha] {d.name}: {e}")
        return 0

    if not args.ticker:
        ap.error("passe TICKER ou --todos")
    processar_ticker(args.ticker)
    return 0


if __name__ == "__main__":
    sys.exit(main())
