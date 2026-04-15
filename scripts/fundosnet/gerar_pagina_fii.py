"""Gera a página completa de análise de um FII a partir do dossiê minerado.

Lê data/fiis-raw/{TICKER}/ (montado por minerar.py), extrai texto de cada doc,
chama Claude Opus 4.6 com prompt usando BTAL11 como exemplo do schema,
e salva data/fiis/{ticker}.json no formato esperado por js/fii-template.js.

Cria também fiis/{ticker}/index.html (via stub_fii.py) se não existir.

Uso:
    python3 gerar_pagina_fii.py --ticker MFII11
    python3 gerar_pagina_fii.py --todos                # tenta todos com dossiê
    python3 gerar_pagina_fii.py --pendentes            # só os sem JSON ou stub
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from extract import para_texto
from paths import DATA, FIIS_DIR, ROOT

FIIS_RAW = DATA / "fiis-raw"
EXEMPLO_BTAL11 = FIIS_DIR / "btal11.json"

MODELO = "opus"
TIMEOUT_CLI = 1200  # 20 min


SYSTEM_GERAR_PAGINA = """Você é o analista-chefe do Rico aos Poucos. Sua missão hoje:
gerar a ANÁLISE COMPLETA de um FII (Fundo de Investimento Imobiliário) brasileiro,
no formato JSON exato que o site espera, baseando-se nos documentos oficiais
fornecidos.

Esta análise vai virar uma página pública profunda — não é resumo. É o tipo de
trabalho que um analista CNPI sênior produziria depois de ler todos os relatórios
gerenciais, demonstrações financeiras e fatos relevantes do fundo.

# REGRAS DE OURO

1. **Não invente.** Se um valor não aparece nos documentos, marque como `null`
   ou ponha "N/D". Conservadorismo > confidence.
2. **Português do Brasil** com todos acentos.
3. **HTML inline** com classes Tailwind para destacar valores em campos de texto:
   - `<strong class="text-emerald-400">positivo</strong>`
   - `<strong class="text-red-400">negativo</strong>`
   - `<strong class="text-amber-400">neutro/atenção</strong>`
   - `<strong class="text-blue-400">informativo</strong>`
4. **Datas em pt-BR**: "27/02/2026". Valores monetários: "R$ 89,11", "R$ 692 Mi".
5. **Análise crítica genuína**: aponte riscos com sinceridade. O leitor é
   investidor que vai colocar dinheiro nesse fundo.
6. **Veredicto honesto**: COMPRA (verde), MANTER (amber), VENDA (red), EM ANÁLISE (slate)
   conforme dados — não é torcida.

# SCHEMA OBRIGATÓRIO

O JSON DEVE ter EXATAMENTE estas chaves no nível raiz (use o exemplo BTAL11
fornecido como gabarito de estrutura, formato dos campos e densidade de conteúdo):

  meta, seo, indicadores, recomendacao, quickStats (4 itens),
  pontosAtencao (3-5 itens), gestora, taxas, portfolio, timeline, tese,
  dividendos, valuation, conclusao, footer

Campos opcionais (preenche só se aplicável): aquisicoes, ativos, ativosDetalhados.

# DICAS POR SEÇÃO

**meta** — sentimento ∈ {otimista, neutro, pessimista}; badges = 3-5 frases
   curtas e factuais ("100% Adimplente", "WAULT 6,8 anos").

**indicadores** — só números/strings curtas. Use os MAIS RECENTES dos docs.

**recomendacao** — nota 0-10, veredicto categórico, cor (emerald/amber/red/slate),
   resumo de 4-7 frases com HTML highlights.

**quickStats** (EXATAMENTE 4) — Patrimônio, Rendimento, Cotistas, Preço Justo /
   Veredicto.

**pontosAtencao** — riscos REAIS extraídos dos docs. Tipo ∈ {positivo, neutro, negativo}.

**gestora** — `stats` (exatamente 3 itens: AuM/AuC do gestor, patrimônio do fundo,
   performance), `nota` 0-10, `notaLabel` (EXCELENTE/BOM/REGULAR), `resumo` com
   HTML, `link` opcional ("../../gestores/btg-pactual/" se a gestora for grande).

**taxas** — `itens` (3-4 cards: administração, gestão, performance, custódia),
   `comparativo` (3-4 outros FIIs do mesmo segmento pra comparar taxas), `detalhes`
   (admin, escriturador, custodiante).

**portfolio** — `stats` (4-6 cards), `tipologiaChart` ({labels:[], data:[]}),
   `locatarioChart`, `locatarios` (top 5 com %), `riscoResumo` (concentracao,
   vacancia, etc), `riscoNota`.

**timeline** — `periodos` é array de épocas do fundo (cada uma com periodo, titulo,
   pontos[] explicando o que aconteceu), `crescimento` mostra evolução de PL/cotas.

**tese** — `resumo` (parágrafo), `paraQuem` (3-5 perfis que fazem sentido),
   `naoParaQuem` (3-5 perfis que devem evitar).

**dividendos** — `chartLabels` (12 meses), `chartData` (valores), `chartCor`,
   `totaisAnuais` (3 anos), `guidance` opcional, `stats` (3 cards: DY, último,
   média, etc).

**valuation** — `pvp` (atual + histórico se houver), `spread` (vs CDI/IPCA/IFIX),
   `recomendacoes` opcional.

**conclusao** — `paragrafos` (3-5), `pontosFortes` (3-5), `pontosDeAtencao` (3-5),
   `conclusaoFinal` (1 parágrafo de fecho).

# OUTPUT

Devolva APENAS o JSON do FII, válido, sem markdown nem texto antes/depois.
Sem ``` `json `, sem comentários. JSON puro.
"""


def _carregar_exemplo() -> dict:
    return json.loads(EXEMPLO_BTAL11.read_text(encoding="utf-8"))


def _carregar_dossie(ticker: str) -> dict:
    pasta = FIIS_RAW / ticker
    meta_path = pasta / "meta.json"
    if not meta_path.exists():
        raise RuntimeError(f"sem dossiê em {pasta}. rode minerar.py --ticker {ticker} antes.")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))

    documentos_com_texto = []
    for d in meta["documentos"]:
        arq = pasta / d["arquivo"]
        if not arq.exists():
            continue
        try:
            raw = arq.read_bytes()
            formato, texto = para_texto(raw)
            documentos_com_texto.append({
                "id": d["id"],
                "tipoDocumento": d.get("tipoDocumento"),
                "categoriaDocumento": d.get("categoriaDocumento"),
                "dataEntrega": d.get("dataEntrega"),
                "dataReferencia": d.get("dataReferencia"),
                "formato": formato,
                "texto": (texto or "")[:30_000],  # limita por doc
            })
        except Exception as e:
            print(f"  [warn] falha extraindo {arq.name}: {e}")
    return {
        "ticker": meta["ticker"],
        "nomePregao": meta.get("nomePregao"),
        "descricaoFundo": meta.get("descricaoFundo"),
        "tipoFundo": meta.get("tipoFundo"),
        "documentos": documentos_com_texto,
    }


# Keywords que indicam erro RECUPERÁVEL (rate limit, crédito, overload, network).
# Casos assim: espera e tenta de novo, não aborta.
_TRANSIENT_PATTERNS = [
    r"rate[ _-]?limit", r"credit", r"quota", r"429", r"too many",
    r"overloaded", r"overload", r"unavailable", r"busy", r"temporarily",
    r"try again", r"try later", r"exceeded", r"limit.*reached",
    r"limit.*exhaust", r"please wait", r"service.*unavailable",
    r"upgrade.*plan", r"insufficient",
]


def _is_transient(err_text: str) -> bool:
    if not err_text:
        return False
    low = err_text.lower()
    return any(re.search(p, low) for p in _TRANSIENT_PATTERNS)


def _chamar_opus(ticker: str, dossie: dict, exemplo: dict) -> dict:
    """Chama Opus via claude CLI. Faz retry com backoff em erro recuperável
    (rate limit, crédito, overload). Espera indefinidamente — sistema deve
    sobreviver a 'crédito acabou' durante a noite até recuperar."""
    user_msg = (
        f"Gere a análise completa do FII **{ticker}** ({dossie.get('descricaoFundo','')}).\n\n"
        f"# EXEMPLO DO SCHEMA — use exatamente esta estrutura, adaptando os valores\n\n"
        f"```json\n{json.dumps(exemplo, ensure_ascii=False, indent=2)[:25000]}\n```\n\n"
        f"# DOSSIÊ DO {ticker} — {len(dossie['documentos'])} documentos\n\n"
        f"```json\n{json.dumps(dossie, ensure_ascii=False, indent=2)[:120000]}\n```\n\n"
        f"Devolva APENAS o JSON do {ticker}. Sem markdown, sem comentários."
    )

    cmd = [
        "claude",
        "--print",
        "--permission-mode", "bypassPermissions",
        "--output-format", "json",
        "--model", MODELO,
        "--system-prompt", SYSTEM_GERAR_PAGINA,
    ]

    tentativa = 0
    backoff = 60  # 1 min inicial; dobra até 30 min
    while True:
        tentativa += 1
        try:
            proc = subprocess.run(
                cmd, input=user_msg,
                capture_output=True, text=True, timeout=TIMEOUT_CLI,
            )
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"claude CLI timeout após {TIMEOUT_CLI}s (tentativa {tentativa})")

        if proc.returncode == 0:
            break

        err = (proc.stderr or "") + " " + (proc.stdout[-1000:] or "")
        if _is_transient(err):
            print(f"  [retry-transiente #{tentativa}] {err.strip()[:200]}")
            print(f"  esperando {backoff}s antes de tentar de novo (aguarda indefinidamente)…")
            time.sleep(backoff)
            backoff = min(backoff * 2, 1800)  # até 30 min entre tentativas
            continue

        # erro permanente — não fica em loop eterno
        raise RuntimeError(f"claude CLI falhou (code {proc.returncode}) — não transiente: "
                           f"stderr={proc.stderr[:300]!r}")

    envelope = json.loads(proc.stdout)
    raw = envelope.get("result") or envelope.get("response")
    if not isinstance(raw, str):
        raise RuntimeError(f"resposta inesperada: {type(raw).__name__}")

    # extrai o primeiro JSON válido da string
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$", "", raw)
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        raise RuntimeError(f"sem JSON na resposta. Início: {raw[:300]!r}")
    return json.loads(m.group(0))


def _garantir_pagina_html(ticker: str, fii_json: dict) -> Path:
    """Cria fiis/{ticker}/index.html se não existir, usando estrutura igual aos atuais."""
    dst_dir = ROOT / "fiis" / ticker.lower()
    dst = dst_dir / "index.html"
    if dst.exists():
        return dst
    dst_dir.mkdir(parents=True, exist_ok=True)

    nome = (fii_json.get("meta") or {}).get("nome", ticker)
    seo = fii_json.get("seo") or {}
    title = seo.get("title", f"{ticker} — Análise | Rico aos Poucos")
    desc = seo.get("description", f"Análise do FII {ticker}.")
    keywords = seo.get("keywords", f"{ticker}, FII, análise")
    og_title = seo.get("ogTitle", title)
    og_desc = seo.get("ogDescription", desc)
    tw_title = seo.get("twitterTitle", title)
    tw_desc = seo.get("twitterDescription", desc)
    canonical = seo.get("canonical", f"https://ricoaospoucos.com.br/fiis/{ticker.lower()}/")

    template = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{canonical}">
    <meta name="keywords" content="{keywords}">
    <meta name="author" content="Rico aos Poucos">

    <meta property="og:title" content="{og_title}">
    <meta property="og:description" content="{og_desc}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="https://ricoaospoucos.com.br/icon-512.png">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="Rico aos Poucos">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@ricoaospoucos">
    <meta name="twitter:title" content="{tw_title}">
    <meta name="twitter:description" content="{tw_desc}">
    <meta name="twitter:image" content="https://ricoaospoucos.com.br/icon-512.png">

    <meta name="theme-color" content="#0d1117">

    <link rel="icon" type="image/png" sizes="192x192" href="../../icon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="../../icon-512.png">
    <link rel="icon" type="image/svg+xml" href="../../favicon.svg">
    <link rel="shortcut icon" href="../../icon-192.png">

    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/fii-page.css">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased" data-ticker="{ticker}">
    <div class="page-wrapper">

    <header id="site-header"></header>

    <div id="fii-loading" style="padding: 20px; max-width: 1280px; margin: 0 auto;">
        <div class="fii-skeleton" style="height: 60px; margin-bottom: 16px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        <div class="fii-skeleton" style="height: 280px; margin-bottom: 24px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
    </div>

    <div id="fii-root" style="display: none;"></div>

    <footer id="site-footer"></footer>

    </div>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../../js/fii-template.js"></script>
    <script src="../../js/fii-layout.js"></script>
    <script>FIITemplate.init({{ dataUrl: '../../data/fiis/{ticker.lower()}.json' }});</script>
</body>
</html>
"""
    dst.write_text(template, encoding="utf-8")
    return dst


def _processar(ticker: str, exemplo: dict) -> dict:
    print(f"\n[gerar] {ticker} — carregando dossiê…")
    dossie = _carregar_dossie(ticker)
    if not dossie["documentos"]:
        raise RuntimeError(f"dossiê de {ticker} sem docs com texto extraído")
    print(f"  {len(dossie['documentos'])} docs com texto, "
          f"~{sum(len(d['texto']) for d in dossie['documentos'])//1000}k chars total")

    print(f"  chamando Opus 4.6…")
    t0 = datetime.now()
    fii_json = _chamar_opus(ticker, dossie, exemplo)
    elapsed = (datetime.now() - t0).total_seconds()
    print(f"  Opus respondeu em {elapsed:.0f}s")

    # valida campos mínimos
    obrigatorios = ["meta", "indicadores", "recomendacao", "quickStats",
                    "pontosAtencao", "tese", "conclusao"]
    faltando = [c for c in obrigatorios if c not in fii_json]
    if faltando:
        raise RuntimeError(f"JSON sem campos obrigatórios: {faltando}")

    # garante ticker
    if "meta" in fii_json:
        fii_json["meta"]["ticker"] = ticker
        fii_json["meta"]["totalDocumentos"] = len(dossie["documentos"])

    # salva JSON
    json_path = FIIS_DIR / f"{ticker.lower()}.json"
    json_path.write_text(json.dumps(fii_json, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  JSON salvo: {json_path.relative_to(ROOT)}")

    # garante página HTML
    html_path = _garantir_pagina_html(ticker, fii_json)
    print(f"  HTML pronto: {html_path.relative_to(ROOT)}")

    return {"ticker": ticker, "ok": True, "elapsed": elapsed}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticker", help="Ticker único")
    ap.add_argument("--tickers", help="Lista separada por vírgula")
    ap.add_argument("--todos", action="store_true", help="Todos com dossiê em fiis-raw/")
    ap.add_argument("--pendentes", action="store_true",
                    help="Só os com dossiê mas sem JSON populado em data/fiis/")
    ap.add_argument("--limit", type=int, default=0,
                    help="Processa no máximo N tickers (0 = sem limite)")
    args = ap.parse_args()

    if not EXEMPLO_BTAL11.exists():
        print(f"erro: exemplo {EXEMPLO_BTAL11} não existe")
        return 1
    exemplo = _carregar_exemplo()

    # determina lista
    if args.ticker:
        tickers = [args.ticker.upper()]
    elif args.tickers:
        tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    elif args.todos or args.pendentes:
        if not FIIS_RAW.exists():
            print(f"erro: sem dossiês em {FIIS_RAW}")
            return 1
        tickers = sorted(p.name for p in FIIS_RAW.iterdir() if (p / "meta.json").exists())
        if args.pendentes:
            def _stub(t):
                p = FIIS_DIR / f"{t.lower()}.json"
                if not p.exists():
                    return True
                try:
                    d = json.loads(p.read_text(encoding="utf-8"))
                    return (d.get("meta", {}).get("totalDocumentos", 0) or 0) <= 1
                except Exception:
                    return True
            tickers = [t for t in tickers if _stub(t)]
        if args.limit > 0:
            tickers = tickers[:args.limit]
    else:
        ap.error("precisa --ticker, --tickers, --todos ou --pendentes")
        return 1

    print(f"[gerar] vai processar {len(tickers)} ticker(s)")
    ok = falha = 0
    for t in tickers:
        try:
            _processar(t, exemplo)
            ok += 1
        except Exception as e:
            falha += 1
            print(f"  [falha] {t}: {e}")
    print(f"\n[gerar] concluído — ok={ok} falha={falha}")
    return 0 if falha == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
