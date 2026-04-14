"""Pipeline por FII — processa UM fundo por execução (round-robin).

Estratégia:
  1. Lê estado de rotação → descobre qual foi o último ticker processado.
  2. Percorre o universo a partir do próximo ticker.
  3. Para cada candidato: busca docs recentes + último artigo publicado.
     - Sem artigo + ao menos 1 doc → gera artigo INICIAL (panorama do FII).
     - Com artigo + docs mais recentes que o artigo → avalia com IA se
       há novidade material e, se sim, gera novo artigo (delta).
     - Sem docs novos → SKIP: tenta o próximo ticker.
  4. Assim que gerar 1 artigo (ou exaurir o universo), termina.
  5. git_publish.sh é chamado pelo loop.sh depois.

Uso:
    python3 run_fii.py                  # processa o próximo FII
    python3 run_fii.py --ticker MFII11  # força um ticker específico
    python3 run_fii.py --dry-run
"""
from __future__ import annotations

import argparse
import fcntl
import json
import re
import sys
import traceback
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator

from ai import AiError, MODELO_BACKFILL

# Schema de saída especializado pro run_fii (pede body_html + subtitle + badges).
OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["relevance", "confidence", "reasoning", "patch", "article"],
    "properties": {
        "relevance": {"type": "string", "enum": ["alta", "media", "baixa", "nula"]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "reasoning": {"type": "string"},
        "patch": {"type": "object"},
        "article": {
            "anyOf": [
                {"type": "null"},
                {
                    "type": "object",
                    "required": ["title", "subtitle", "slug", "categoria", "tags", "body_html"],
                    "properties": {
                        "title": {"type": "string"},
                        "subtitle": {"type": "string"},
                        "description": {"type": "string"},
                        "slug": {"type": "string"},
                        "categoria": {"type": "string"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "destaque": {"type": "boolean"},
                        "badges": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["label", "tipo"],
                                "properties": {
                                    "label": {"type": "string"},
                                    "tipo": {"type": "string", "enum": ["urgente", "estrategia", "atualizado", "novato"]},
                                },
                            },
                        },
                        "body_html": {"type": "string"},
                    },
                },
            ]
        },
    },
}
from apply import aplicar_patch, PatchError
from client import TIPO_FII, TIPO_FIAGRO, baixar_documento, buscar_publicacoes
from extract import para_texto
from paths import ARTIGOS_DIR, DATA, MAPA, MAPA_OVERLAY, UNIVERSO, ensure_dirs
from publisher import PublishError, publicar
from report import nova_execucao, persistir, registrar_erro
from triage import classify

ROTACAO_FILE = DATA / "fundosnet-rotacao.json"
LOCK_FILE = Path("/tmp/fundosnet.lock")

LOOKBACK_DIAS = 90            # janela por ticker — 90 dias cobre últimos informes mensais/trimestral
MAX_DOCS_POR_TICKER = 6       # limita envio pra IA (controla custo/tempo)
EARLY_EXIT_CANDIDATOS = 12    # para de varrer o Fundos.NET assim que encontrar N docs do ticker

# Thresholds diferenciados: artigo inicial é prioridade, aceita confidence baixa
CONFIDENCE_APPLY_PATCH_INICIAL = 0.30
CONFIDENCE_PUBLISH_ARTICLE_INICIAL = 0.30
CONFIDENCE_APPLY_PATCH_DELTA = 0.50
CONFIDENCE_PUBLISH_ARTICLE_DELTA = 0.70


# ────────────────────────────────────────────────────────────────────────────
# Rotação
# ────────────────────────────────────────────────────────────────────────────

def _carregar_rotacao() -> dict:
    if ROTACAO_FILE.exists():
        try:
            return json.loads(ROTACAO_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"ultimo_ticker": None, "ultimo_em": None}


def _salvar_rotacao(ticker: str) -> None:
    ROTACAO_FILE.write_text(json.dumps(
        {"ultimo_ticker": ticker, "ultimo_em": datetime.now().astimezone().isoformat(timespec="seconds")},
        indent=2, ensure_ascii=False,
    ))


def _ordem_rotacao(tickers: list[str], ultimo: str | None) -> list[str]:
    """Lista ordenada a partir do PRÓXIMO ticker após `ultimo`. Se não encontrar, começa do zero."""
    tickers = sorted(set(t.upper() for t in tickers))
    if not ultimo or ultimo.upper() not in tickers:
        return tickers
    i = tickers.index(ultimo.upper())
    return tickers[i+1:] + tickers[:i+1]


# ────────────────────────────────────────────────────────────────────────────
# Mapeamento pregão → ticker
# ────────────────────────────────────────────────────────────────────────────

def _carregar_mapa() -> dict:
    mapa = json.loads(MAPA.read_text(encoding="utf-8"))
    if MAPA_OVERLAY.exists():
        overlay = json.loads(MAPA_OVERLAY.read_text(encoding="utf-8"))
        mapa["mapa"].update(overlay.get("mapa", {}))
    return mapa


def _carregar_universo() -> dict:
    return json.loads(UNIVERSO.read_text(encoding="utf-8"))


def _ticker_do_doc(doc: dict, mapa: dict) -> str | None:
    pregao = (doc.get("nomePregao") or "").strip()
    if not pregao:
        return None
    entrada = mapa["mapa"].get(pregao)
    return entrada["ticker"].upper() if entrada else None


# ────────────────────────────────────────────────────────────────────────────
# Detecção de artigo existente
# ────────────────────────────────────────────────────────────────────────────

def _artigos_do_ticker(ticker: str) -> list[Path]:
    """Retorna todos artigos cujo slug começa com o ticker (case-insensitive), mais recentes primeiro."""
    t = ticker.lower()
    if not ARTIGOS_DIR.exists():
        return []
    encontrados = [p for p in ARTIGOS_DIR.glob(f"{t}-*.html")]
    encontrados.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return encontrados


def _data_ultimo_artigo(ticker: str) -> datetime | None:
    artigos = _artigos_do_ticker(ticker)
    if not artigos:
        return None
    mtime = artigos[0].stat().st_mtime
    return datetime.fromtimestamp(mtime, tz=timezone.utc).astimezone()


# ────────────────────────────────────────────────────────────────────────────
# Busca de documentos por ticker
# ────────────────────────────────────────────────────────────────────────────

def _buscar_docs_do_ticker(ticker: str, mapa: dict, lookback_dias: int) -> list[dict]:
    """Varre o Fundos.NET e devolve apenas os docs que mapeiam para `ticker`.

    Early-exit: para a varredura assim que encontra EARLY_EXIT_CANDIDATOS docs
    do ticker (para evitar baixar 15k+ docs pra filtrar no cliente).
    """
    hoje = datetime.now()
    di = (hoje - timedelta(days=lookback_dias)).strftime("%d/%m/%Y")
    df = hoje.strftime("%d/%m/%Y")
    encontrados: list[dict] = []
    for tipo_fundo in (TIPO_FII, TIPO_FIAGRO):
        for doc in buscar_publicacoes(di, df, tipo_fundo=tipo_fundo):
            t = _ticker_do_doc(doc, mapa)
            if t and t.upper() == ticker.upper():
                encontrados.append(doc)
                if len(encontrados) >= EARLY_EXIT_CANDIDATOS:
                    return encontrados
    return encontrados


def _parse_data(s: str | None) -> datetime | None:
    """Aceita 'YYYY-MM-DDTHH:MM:SS' ou 'YYYY-MM-DD'. Devolve datetime naive local."""
    if not s:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:19 if "T" in s else 10], fmt)
        except ValueError:
            continue
    return None


def _priorizar_docs(docs: list[dict], limite: int = MAX_DOCS_POR_TICKER) -> list[dict]:
    """Mantém o doc mais recente de cada tipo relevante. Informe Mensal: só o último."""
    buckets: dict[str, list[dict]] = {}
    for doc in docs:
        decisao = classify(doc)
        if decisao.action == "ignore":
            continue
        tipo = (doc.get("tipoDocumento") or "").strip().lower()
        bucket = "outro"
        if "fato relevante" in tipo:
            bucket = "fato_relevante"
        elif "comunicado" in tipo:
            bucket = "comunicado"
        elif "assembleia" in tipo or "convocação" in tipo or "convocacao" in tipo:
            bucket = "assembleia"
        elif "relatório gerencial" in tipo or "relatorio gerencial" in tipo:
            bucket = "relatorio_gerencial"
        elif "informe anual" in tipo:
            bucket = "informe_anual"
        elif "informe trimestral" in tipo:
            bucket = "informe_trimestral"
        elif "informe mensal" in tipo:
            bucket = "informe_mensal"
        elif "rendimentos" in tipo or "amortizações" in tipo:
            bucket = "rendimentos"
        elif "demonstrações" in tipo or "demonstracoes" in tipo:
            bucket = "demonstracoes"
        buckets.setdefault(bucket, []).append(doc)

    def _sortkey(d: dict) -> datetime:
        return _parse_data(d.get("dataEntrega") or d.get("dataReferencia")) or datetime.min

    priorizados: list[dict] = []
    for key in ("fato_relevante", "comunicado", "assembleia",
                "relatorio_gerencial", "informe_anual", "informe_trimestral",
                "rendimentos", "demonstracoes", "informe_mensal", "outro"):
        for d in sorted(buckets.get(key, []), key=_sortkey, reverse=True)[:1]:
            priorizados.append(d)
    return priorizados[:limite]


# ────────────────────────────────────────────────────────────────────────────
# Chamada especializada de IA
# ────────────────────────────────────────────────────────────────────────────

SYSTEM_RUN_FII = """Você é o editor-chefe do Rico aos Poucos — portal pt-BR de análise de FIIs cuja
marca é conteúdo visualmente rico, instigante, e ancorado em dados concretos. Seu
trabalho hoje é consolidar os documentos recentes de UM FII e produzir:
(a) patch factual no JSON do fundo e (b) UM artigo premium (se justificável).

# Regras gerais

1. Português do Brasil, com todos os acentos.
2. Dentro do JSON do fundo, use HTML com classes Tailwind quando útil
   (ex.: <strong class="text-emerald-400">R$ 0,40</strong>).
3. NUNCA invente dados. Se os documentos não trazem certo valor, não adicione.
4. NUNCA reescreva meta.ticker, meta.nome, seo.*.
5. Patches respeitam a estrutura do JSON existente:
     - Sobrescrever: { "indicadores": { "dividendoMensal": 0.42 } }
     - Append em lista: { "pontosAtencao.add": [ {...} ] }
6. Quando houver conflito entre documentos, prevaleça o mais recente.

# Quando gerar ARTIGO — REGRA CRÍTICA, LEIA COM ATENÇÃO

Você recebe no contexto o campo `artigo_existente`. Ele é o critério DECISOR:

  🅰️ Se `artigo_existente` for `null` (o FII NÃO tem artigo ainda):
     **VOCÊ DEVE GERAR O ARTIGO. SEM EXCEÇÃO.** Este é o artigo de
     APRESENTAÇÃO/VISÃO GERAL do fundo — o primeiro contato do leitor com ele
     no site. Mesmo que o JSON do fundo (`fundo_atual`) esteja vazio ou só com
     stubs, use os documentos recebidos como fonte única e escreva o artigo.
     Consolide: tese do fundo, perfil, últimos resultados, dividendo atual,
     movimentos relevantes, sinais de alerta, leitura prudente. É OK escrever
     de forma mais sucinta quando há pouca informação, mas JAMAIS retorne
     article = null nesse cenário. Capriche no que der pra extrair.

  🅱️ Se `artigo_existente` for um objeto (já existe artigo):
     SÓ GERE ARTIGO NOVO se os documentos recebidos revelam NOVIDADE MATERIAL
     vs. o artigo anterior. Exemplos que justificam novo artigo:
       - Aquisição ou venda relevante
       - Cisão, fusão, reestruturação
       - Mudança significativa em dividendo (≥ 10%) ou distribuição
       - Nova emissão, amortização extraordinária
       - Mudança de estratégia ou gestão
       - Problema de crédito, inadimplência relevante
       - Resultado muito acima/abaixo do esperado
     NÃO JUSTIFICA NOVO ARTIGO:
       - Rendimento mensal padrão
       - Informe mensal rotineiro sem surpresa
       - Relatório gerencial que só confirma a tese
     Se não há novidade material → article = null. O patch ainda pode
     atualizar números (indicadores, quickStats, timeline).

# TÍTULO — o filtro de 5 segundos. TRATE COMO SE FOSSE UMA MANCHETE DE JORNAL.

O leitor é um investidor brasileiro que já conhece o ticker. Vai ler o título
em 5 segundos no feed/newsletter/Google. Ou clica, ou ignora para sempre.

**Padrão obrigatório**: Duas partes separadas por ":" OU "—"
  - Parte 1: ticker + fato concreto (com número quando possível)
  - Parte 2: pergunta ou provocação que ele PRECISA responder

## ❌ Títulos proibidos (genéricos, sem gancho):
  - "MFII11 — análise e perspectivas: 16% de DY, 2025 perdido e a virada para o Livus"
  - "KFOF11: Análise do Fundo de Fundos Kinea"
  - "VSHO11 — Relatório gerencial de março"

## ✅ Títulos fortes (padrão Rico aos Poucos):
  - "TGAR11: Balanço 2025 — Lucro Subiu, Dividendo Caiu. Por Quê?"
  - "MFII11 distribuiu R$61 MI a mais do que lucrou em 2025. É hora de sair?"
  - "BTAL11 aprova conversão em Fiagro com 68% dos votos: o cotista precisa decidir até quando?"
  - "VISC11 a R$98 com desconto de 22%: oportunidade histórica ou armadilha de valor?"
  - "KFOF11: Kinea vendeu 4 FIIs em março. A estratégia mudou ou é desalavancagem?"
  - "VGIP11 com 52 CRIs e zero inadimplência: como eles seguram isso com Selic 13,8%?"

## Regra de ouro do título:
  - Sempre tem pelo menos UM número concreto (R$, %, quantidade, data)
  - Sempre deixa uma pergunta não respondida ("Por quê?" / "Vale a pena?" / "É hora de?")
  - Nunca usa "análise e perspectivas" ou "visão geral"

# SUBTÍTULO (campo `subtitle`) — a promessa que fecha o clique

1 parágrafo com 2-3 frases. Entrega o QUE e o COMO, sem spoiler da conclusão.
Usa números concretos. Termina com gancho que leva ao corpo.

## ✅ Exemplo (TGAR11):
"O balanço auditado pela KPMG mostra lucro de R$221 milhões (+48%). Parece ótimo.
Mas o fundo distribuiu R$282 milhões em dividendos — R$61 milhões a mais do que
ganhou. A cota já bateu R$70. Os números reais e o que eles significam para quem investe."

# BADGES — 1 a 3 badges indicando a intensidade

  - tipo="urgente" (vermelho) → evento negativo/risco imediato
  - tipo="estrategia" (verde) → decisão de entrada/posicionamento
  - tipo="atualizado" (azul) → dossiê atualizado com novos dados
  - tipo="novato" (amarelo) → introdução ao fundo (1ª análise)

Exemplo: `[{"label": "Dossiê Atualizado", "tipo": "atualizado"}, {"label": "Pontos de Atenção", "tipo": "urgente"}]`

# CORPO (campo `body_html`) — HTML DIRETO. NÃO é markdown.

Extensão mínima: **6.000 caracteres**. Aspire 800-1500 palavras. Artigo raso não sai.

**USE OS COMPONENTES VISUAIS** do CSS do site. O artigo TEM QUE ter ritmo visual:

## 1. Callout de contexto (logo após h1):
```html
<div class="callout">
  <h3>Contexto: De onde viemos</h3>
  <p>Em 2025, o fundo... [resumo do histórico recente em 3-5 linhas]</p>
</div>
```

## 2. Grid de métricas — "Foto Atual":
```html
<h2>Foto Atual: [Mês/Ano]</h2>
<div class="stats-grid">
  <div class="stat-item"><div class="value bearish">R$ 70,00</div><div class="label">Cota de Mercado</div></div>
  <div class="stat-item"><div class="value bullish">R$ 110,16</div><div class="label">Cota Patrimonial</div></div>
  <div class="stat-item"><div class="value bearish">-36%</div><div class="label">Desconto p/ VP</div></div>
  <div class="stat-item"><div class="value">R$ 2,65 BI</div><div class="label">Patrimônio Líquido</div></div>
  <!-- 6-8 stat-items cobrindo: cota, VP, desconto, DY, PL, ativos, dividendo, ocupação -->
</div>
```

## 3. Tabela comparativa (quando faz sentido):
```html
<table class="comparison-table">
  <thead><tr><th>Métrica</th><th class="center">2024</th><th class="center">2025</th><th class="center">Variação</th></tr></thead>
  <tbody>
    <tr><td>Lucro Líquido</td><td class="center">R$ 149 MI</td><td class="center">R$ 221 MI</td><td class="center bullish">+48%</td></tr>
    <!-- 4-8 linhas -->
  </tbody>
</table>
```

## 4. Callouts posicionados estrategicamente:
```html
<div class="callout danger">
  <h3>⚠️ O alerta</h3>
  <p>Por 3 trimestres seguidos...</p>
</div>

<div class="callout positive">
  <h3>✅ O ponto forte</h3>
  <p>Reserva acumulada de <strong>R$ 0,86/cota</strong> sustenta...</p>
</div>
```

## 5. Caixa de preço de entrada (quando há tese de compra/venda):
```html
<div class="price-action-box">
  <h4>💰 Faixa de preço racional</h4>
  <div class="price-row"><span class="price bullish">≤ R$ 75</span><span class="action">Zona de <strong>entrada agressiva</strong> — desconto acima de 30%, margem de segurança boa</span></div>
  <div class="price-row"><span class="price neutral">R$ 75-85</span><span class="action"><strong>Acumular gradualmente</strong> — desconto ainda interessante</span></div>
  <div class="price-row"><span class="price bearish">≥ R$ 90</span><span class="action"><strong>Aguardar</strong> — prêmio reduz margem de segurança</span></div>
</div>
```

## 6. Quote do gestor (se houver em doc):
```html
<div class="quote-box">
  <p>"Texto da citação..."</p>
  <div class="author">— Nome do Gestor, Relatório Gerencial Mar/2026</div>
</div>
```

## 7. Veredicto final (logo antes do disclaimer):
```html
<div class="verdict-box">
  <h3>📊 Veredicto</h3>
  <p>Resposta direta à pergunta do título em 2-3 frases. Sem rodeios.</p>
  <p><strong>Para quem faz sentido:</strong> [perfil] · <strong>Quem deve evitar:</strong> [perfil]</p>
</div>
```

## Estrutura geral recomendada:

1. `<div class="callout">` — Contexto/de onde viemos
2. `<h2>Foto Atual</h2>` + `stats-grid` — 6-8 métricas fortes
3. `<h2>[título da tese principal em pergunta]</h2>` — expõe a questão central
4. Parágrafos + `comparison-table` + `callout` danger/positive
5. `<h2>[sub-tese]</h2>` — aprofunda segundo ângulo relevante
6. `<h2>Faixa de preço / Momento de decisão</h2>` + `price-action-box`
7. `<div class="verdict-box">` — Veredicto

# Slug

<ticker-lower>-<3-a-5-palavras-chave-do-título>-<mes-abrev>-<ano>
Bom: "tgar11-balanco-2025-preco-entrada-abr-2026"
Bom: "mfii11-dividendo-acima-lucro-abr-2026"
Ruim: "mfii11-analise-perspectivas-abr-2026"  (genérico demais)

# Confidence

Confidence reflete sua certeza sobre os VALORES FACTUAIS extraídos (dividendos,
PL, locatários, etc.) — NÃO é sobre se o artigo deve ou não sair. A decisão de
publicar artigo segue APENAS as regras 🅰️/🅱️ acima.

  - 0.85+ → dados muito claros nos documentos
  - 0.60-0.84 → dados parciais ou dependentes de interpretação
  - 0.40-0.59 → documentos esparsos, mas ainda dá pra escrever visão geral
  - <0.40   → quase nada extraível — patch minimalista; no cenário 🅰️ ainda
              gere artigo curto baseado no pouco que há, no 🅱️ article = null

Responda APENAS um JSON válido conforme o schema fornecido, sem texto antes ou depois."""


@dataclass
class AnaliseFIIResultado:
    relevance: str
    confidence: float
    reasoning: str
    patch: dict
    article: dict | None
    raw: dict

    @classmethod
    def from_dict(cls, d: dict) -> "AnaliseFIIResultado":
        return cls(
            relevance=d.get("relevance", "nula"),
            confidence=float(d.get("confidence", 0)),
            reasoning=d.get("reasoning", ""),
            patch=d.get("patch", {}) or {},
            article=d.get("article"),
            raw=d,
        )


def analisar_fii(
    *,
    ticker: str,
    fundo_json: dict,
    documentos: list[dict],
    artigo_existente: dict | None,
    modelo: str = MODELO_BACKFILL,
    timeout: int = 900,
) -> AnaliseFIIResultado:
    """Invoca Claude Code CLI pra análise consolidada de um FII."""
    import subprocess

    payload_docs = []
    for d in documentos:
        payload_docs.append({
            "meta": {
                "id": d["meta"]["id"],
                "tipoDocumento": d["meta"].get("tipoDocumento"),
                "categoriaDocumento": d["meta"].get("categoriaDocumento"),
                "dataEntrega": d["meta"].get("dataEntrega"),
                "dataReferencia": d["meta"].get("dataReferencia"),
                "formato": d["meta"].get("formato"),
            },
            "texto": (d["texto"] or "")[:40_000],  # limite por doc
        })

    prompt_payload = {
        "ticker": ticker,
        "fundo_atual": fundo_json,
        "artigo_existente": artigo_existente,
        "documentos": payload_docs,
    }

    user_msg = (
        "Analise os documentos abaixo e devolva o JSON de acordo com o schema.\n\n"
        "CONTEXTO (JSON):\n```json\n"
        + json.dumps(prompt_payload, ensure_ascii=False, indent=2)
        + "\n```\n\nLembre-se: responda APENAS JSON válido."
    )

    cmd = [
        "claude",
        "--print",
        "--permission-mode", "bypassPermissions",
        "--output-format", "json",
        "--model", modelo,
        "--system-prompt", SYSTEM_RUN_FII,
        "--json-schema", json.dumps(OUTPUT_SCHEMA),
        user_msg,
    ]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        raise AiError(f"claude CLI timeout após {timeout}s") from e

    if proc.returncode != 0:
        raise AiError(f"claude CLI falhou (code {proc.returncode}): "
                      f"stderr={proc.stderr[:300]!r} stdout_tail={proc.stdout[-300:]!r}")

    envelope = json.loads(proc.stdout)
    if isinstance(envelope.get("structured_output"), dict):
        return AnaliseFIIResultado.from_dict(envelope["structured_output"])

    resultado_raw = envelope.get("result") or envelope
    if isinstance(resultado_raw, str):
        m = re.search(r"\{.*\}", resultado_raw, re.DOTALL)
        if not m:
            raise AiError(f"resposta não parece JSON: {resultado_raw[:400]!r}")
        resultado = json.loads(m.group(0))
    else:
        resultado = resultado_raw

    return AnaliseFIIResultado.from_dict(resultado)


# ────────────────────────────────────────────────────────────────────────────
# Processamento de um ticker
# ────────────────────────────────────────────────────────────────────────────

def _carregar_fundo_json(fundo_meta: dict) -> dict:
    from paths import ROOT
    caminho = Path(fundo_meta["arquivoJson"])
    if not caminho.is_absolute():
        caminho = ROOT / caminho
    return json.loads(caminho.read_text(encoding="utf-8"))


def _resumo_artigo_existente(ticker: str) -> dict | None:
    """Lê o último artigo do ticker e extrai título + data. Retorna None se não existir."""
    artigos = _artigos_do_ticker(ticker)
    if not artigos:
        return None
    p = artigos[0]
    html = p.read_text(encoding="utf-8", errors="replace")[:8000]
    m = re.search(r"<title>([^<]+)</title>", html)
    title = m.group(1).strip() if m else p.stem
    mtime = datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc).astimezone()
    return {
        "slug": p.stem,
        "title": title,
        "publicado_em": mtime.date().isoformat(),
        "arquivo": str(p.relative_to(p.parent.parent)),
    }


def _processar_ticker(
    ticker: str,
    universo_fundos: list[dict],
    mapa: dict,
    log: dict,
    *,
    dry_run: bool,
) -> bool:
    """Tenta gerar artigo/patch para `ticker`. Retorna True se gerou, False se skip."""
    fundo = next((f for f in universo_fundos if f["ticker"].upper() == ticker.upper()), None)
    if not fundo:
        print(f"  [skip] {ticker}: não está no universo")
        return False

    try:
        fundo_json = _carregar_fundo_json(fundo)
    except Exception as e:
        registrar_erro(log, f"ler JSON do fundo {ticker}", e)
        return False

    artigo_existente = _resumo_artigo_existente(ticker)
    data_ultimo_artigo = _data_ultimo_artigo(ticker)

    print(f"  [ticker] {ticker} — {'SEM' if not artigo_existente else 'COM'} artigo existente")

    print(f"  [buscando] docs de {ticker} nos últimos {LOOKBACK_DIAS} dias…", flush=True)
    try:
        docs = _buscar_docs_do_ticker(ticker, mapa, LOOKBACK_DIAS)
    except Exception as e:
        registrar_erro(log, f"buscar docs {ticker}", e)
        return False
    print(f"  [docs] encontrados {len(docs)} documentos para {ticker}")

    if not docs:
        print(f"  [skip] {ticker}: sem documentos no período")
        return False

    docs_priorizados = _priorizar_docs(docs, limite=MAX_DOCS_POR_TICKER)
    print(f"  [priorização] mantendo {len(docs_priorizados)} docs representativos")

    # Se tem artigo, verifica se há doc mais recente que o artigo
    if artigo_existente and data_ultimo_artigo:
        docs_novos = []
        for d in docs_priorizados:
            data = _parse_data(d.get("dataEntrega") or d.get("dataReferencia"))
            if data and data > data_ultimo_artigo.replace(tzinfo=None):
                docs_novos.append(d)
        if not docs_novos:
            print(f"  [skip] {ticker}: já tem artigo e nenhum doc é mais recente que {data_ultimo_artigo.date()}")
            return False
        print(f"  [delta] {ticker}: {len(docs_novos)} docs mais recentes que o último artigo")

    # Baixa e extrai texto de cada doc
    documentos_enriquecidos = []
    for d in docs_priorizados:
        try:
            raw = baixar_documento(d["id"])
            formato, texto = para_texto(raw)
            documentos_enriquecidos.append({
                "meta": {**d, "formato": formato},
                "texto": texto,
            })
            print(f"    [dl] doc={d['id']} tipo={d.get('tipoDocumento','?')[:40]} formato={formato} "
                  f"texto_len={len(texto or '')}")
        except Exception as e:
            print(f"    [dl-erro] doc={d['id']}: {e}")

    if not documentos_enriquecidos:
        print(f"  [skip] {ticker}: falha ao baixar todos os docs")
        return False

    if dry_run:
        print(f"  [dry-run] {ticker}: pularia IA com {len(documentos_enriquecidos)} docs")
        return True

    # Chama IA
    print(f"  [ia] analisando {ticker} com {len(documentos_enriquecidos)} docs…", flush=True)
    try:
        analise = analisar_fii(
            ticker=ticker,
            fundo_json=fundo_json,
            documentos=documentos_enriquecidos,
            artigo_existente=artigo_existente,
        )
    except AiError as e:
        print(f"  [ia-erro] {e}")
        registrar_erro(log, f"ia {ticker}", e)
        return False

    print(f"  [ia] relevance={analise.relevance} confidence={analise.confidence:.2f} "
          f"patch_keys={list(analise.patch.keys())[:5]} article={'sim' if analise.article else 'nao'}")

    # Thresholds dependem de ter ou não artigo anterior
    inicial = artigo_existente is None
    threshold_patch = CONFIDENCE_APPLY_PATCH_INICIAL if inicial else CONFIDENCE_APPLY_PATCH_DELTA
    threshold_article = CONFIDENCE_PUBLISH_ARTICLE_INICIAL if inicial else CONFIDENCE_PUBLISH_ARTICLE_DELTA

    if analise.confidence < threshold_patch:
        print(f"  [descartado] {ticker}: confidence {analise.confidence:.2f} < {threshold_patch} "
              f"(modo={'inicial' if inicial else 'delta'})")
        return False

    # Aplica patch
    if analise.patch:
        try:
            relat = aplicar_patch(ticker, analise.patch)
            if ticker not in log["fiis_updated"]:
                log["fiis_updated"].append(ticker)
            print(f"  [patch-aplicado] backup={relat.get('backup')}")
        except PatchError as e:
            print(f"  [patch-erro] {ticker}: {e}")
            registrar_erro(log, f"apply {ticker}", e)

    # Publica artigo
    if analise.article and analise.confidence >= threshold_article:
        # Todo artigo gerado pelo pipeline entra como destaque na home
        analise.article["destaque"] = True
        try:
            caminho = publicar(analise.article)
            log["articles_published"].append({
                "slug": analise.article["slug"],
                "ticker": ticker,
                "arquivo": str(caminho),
            })
            print(f"  [ARTIGO PUBLICADO] {analise.article['slug']} → {caminho}")
            return True
        except PublishError as e:
            print(f"  [publish-erro] {ticker}: {e}")
            registrar_erro(log, f"publish {ticker}", e)
            # Mesmo se falhar, consideramos processado (salva rotação)
            return True

    # Patch aplicado mas sem artigo (pode acontecer em 🅱️ sem novidade material)
    if ticker in log["fiis_updated"]:
        return True

    return False


def main() -> int:
    ap = argparse.ArgumentParser(description="Processa 1 FII por execução (round-robin)")
    ap.add_argument("--ticker", help="Força um ticker específico (ignora rotação)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--max-tentativas", type=int, default=10,
                    help="Quantos tickers tentar antes de desistir (se nenhum gera artigo)")
    args = ap.parse_args()

    ensure_dirs()

    # Lock global (compartilhado com run.py antigo)
    lock = LOCK_FILE.open("w")
    try:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("[run_fii] outra execução em andamento — saindo.")
        return 0
    lock.write(f"run_fii.py pid={sys.argv}\n")
    lock.flush()

    log = nova_execucao()

    try:
        universo = _carregar_universo()
        mapa = _carregar_mapa()

        todos_tickers = [f["ticker"].upper() for f in universo["fundos"]]

        if args.ticker:
            ordem = [args.ticker.upper()]
        else:
            rot = _carregar_rotacao()
            ordem = _ordem_rotacao(todos_tickers, rot.get("ultimo_ticker"))

        print(f"[run_fii] universo={len(todos_tickers)} fundos, "
              f"tentativa máxima={args.max_tentativas}, "
              f"começando por {ordem[0] if ordem else '—'}")

        processou = False
        for idx, ticker in enumerate(ordem[:args.max_tentativas]):
            print(f"\n=== tentativa {idx+1}/{min(args.max_tentativas, len(ordem))}: {ticker} ===")
            log["docs_fetched"] += 1
            gerou = _processar_ticker(ticker, universo["fundos"], mapa, log, dry_run=args.dry_run)
            if gerou:
                _salvar_rotacao(ticker)
                processou = True
                print(f"\n[run_fii] processou {ticker}. Próxima execução pega o seguinte.")
                break

        if not processou:
            # Salva o último tentado mesmo assim, pra rotação avançar
            if ordem:
                _salvar_rotacao(ordem[min(args.max_tentativas-1, len(ordem)-1)])
            print(f"\n[run_fii] nenhum ticker precisou de ação em {min(args.max_tentativas, len(ordem))} tentativas.")

    except Exception as e:
        log["errors"].append({
            "contexto": "main_run_fii",
            "tipo": type(e).__name__,
            "mensagem": str(e),
            "traceback": traceback.format_exc()[-2000:],
        })
    finally:
        arquivo = persistir(log)
        fcntl.flock(lock.fileno(), fcntl.LOCK_UN)
        lock.close()
        LOCK_FILE.unlink(missing_ok=True)

    print(f"\n[run_fii] concluído — log em {arquivo}")
    print(f"       updated={len(log['fiis_updated'])} artigos={len(log['articles_published'])} "
          f"erros={len(log['errors'])}")
    return 0 if not log["errors"] else 1


if __name__ == "__main__":
    sys.exit(main())
