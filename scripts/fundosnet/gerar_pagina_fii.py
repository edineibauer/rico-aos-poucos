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
from typing import Any

from extract import para_texto
from paths import DATA, FIIS_DIR, ROOT

FIIS_RAW = DATA / "fiis-raw"
EXEMPLO_BTAL11 = FIIS_DIR / "btal11.json"
PARES_PATH = DATA / "pares_subsegmento.json"
MACRO_PATH = DATA / "macro_snapshot.json"

MODELO = "opus"
TIMEOUT_CLI = 1800  # 30 min (Opus pode precisar em análises complexas)


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

**portfolio (FOF) — TRATAMENTO ESPECIAL.** Quando `portfolio.tipoFundo = "fof"`:
   - `ativos[]` DEVE conter cada FII detido com: `tipo: "fii"`, `ticker` (em CAIXA ALTA), `qtdCotas` (obrigatório), `precoMedio` (preço de livro), `valorPresente` (valor contábil), `percPL`, `segmentoFinal`, `fonte`, `docId`.
   - Cobertura mínima de 90% do PL em ativos discriminados (FIIs + outros via `tipo: "outro"` com `categoria: "caixa"` ou `"cri"`).
   - Fontes: Informe Trimestral, Relatório Gerencial, Demonstrações Financeiras (têm tabela "Composição da carteira" com cotas e valores).
   - Se o doc não informa `precoMedio`, deixar `null` — não inventar. Se não informa `qtdCotas` mas informa `valorPresente` e `precoMedio`, calcular qtd como `valorPresente / precoMedio` e marcar `fonte: "estimado de valor / preço médio"`.
   - O renderer calcula client-side (sem ajuda do LLM) o VP em tempo real, P/VP real, Δ vs preço médio.

**timeline** — `periodos` é array de épocas do fundo (cada uma com periodo, titulo,
   pontos[] explicando o que aconteceu), `crescimento` mostra evolução de PL/cotas.

**tese** — `resumo` (parágrafo), `paraQuem` (3-5 perfis que fazem sentido),
   `naoParaQuem` (3-5 perfis que devem evitar).

**dividendos** — `chartLabels` (12 meses), `chartData` (valores), `chartCor`,
   `totaisAnuais` (3 anos), `guidance` opcional, `stats` (3 cards: DY, último,
   média, etc).

**valuation (schema v2 OBRIGATÓRIO)** — siga rigorosamente a seção
   "Aba Valuation v2" do `ANALISE_FII_PADRAO.md`. Você receberá no dossiê:
   • `historico_precos.csv` (preço NÃO ajustado, semanal/diário) — usar para descrever movimento de preço, não para ajustar valuation por preço médio.
   • `historico_vp.csv` (VP/cota mês a mês a partir dos Informes Mensais).
   • `macro_snapshot.json` (Selic atual + projetada Focus + IPCA Focus + DI).
   • `pares_subsegmento.json` (subsegmentos canônicos com `premioRiscoSegmento` + estatísticas de pares).

   PRODUZA, dentro de `valuation`:
   • `schema: "v2"` + `dataAnalise`.
   • `historicoPrecos` (ponteiro `csvPath` + `frequencia` + `ultimoFechamento` + `min/maxHistorico`).
   • `historicoVp` (ponteiro `csvPath` + `ultimoVpCota` + `ultimoVpData`).
   • `eventosValuation[]` — TODOS os eventos do tipo emissao/reavaliacao_pos|neg/venda_relevante/aquisicao_relevante/mudanca_gestor/evento_credito/amortizacao_extraordinaria documentados, com `data` exata, `tipo`, `titulo`, `descricao` (HTML curto), `impactoVp` (delta R$/cota se aplicável), `fonte`, `docId`.
   • `paresComparaveis` — classificar o fundo num dos subsegmentos do `pares_subsegmento.json`. Se nenhum cabe perfeitamente, marcar `statusClassificacao: "proposto"` com 4-6 candidatos. Preencher `posicaoFundo.leitura` explicando se o desconto/prêmio vs pares é justificado.
   • `pvp`, `spread` — manter estrutura existente.
   • `precoJustoMercado` — modelo híbrido com 4 componentes (A1 DY-Selic, A2 P/VP pares, A3 DY pares, A4 fator qualidade ∈ [0.85, 1.15]). Pesos default 0.40/0.25/0.20 mais A4. Pode ajustar pesos com justificativa documentada. `valor` deve ficar entre 0.7× e 1.5× cotação atual; faixa entre ±3% e ±15%. Cada componente precisa de `calculo` explícito + `racional`.
   • `expectativa.curto` (3-6m), `expectativa.medio` (1-2a), `expectativa.longo` (3-5a) — cada um com `precoEsperado`, `faixa`, `direcao` (queda_forte | queda | lateral_baixa | lateral | lateral_alta | alta | alta_forte | indefinido), `catalisadores[]` (cada um com `evento` concreto, `data`, `impactoEsperado`, `fonte`/`docId`), `racional` em HTML.

   **REGRAS DURAS:**
   - Toda projeção em `expectativa.*.catalisadores[]` precisa citar evento DOCUMENTADO (com `docId` do dossiê) ou referência macro pública (Focus, curva DI). Vibe genérica não conta.
   - Se não houver catalisadores claros para algum horizonte, devolver `precoEsperado: null` e `direcao: "indefinido"` no horizonte. NÃO inventar.
   - `expectativa` deve ser COERENTE com `dividendos.sintese.tendencia` — se Dividendos diz queda projetada, Valuation curto/médio NÃO pode ser `alta_forte` sem racional explícito.
   - `recomendacoes` (legado) → `null`.

**relacoes (schema v1) — DETECTAR CONFLITOS DE INTERESSE.** Top-level array `relacoes[]`. Para cada vínculo material com outros FIIs, gestoras ou contrapartes recorrentes, registre item com:
   - `id`: chave única `{TICKER}-{CONTRAPARTE}-{YYYY-MM}`.
   - `contraparte`: `{ticker, tipo, nome, gestora}`. Tipo ∈ {fii, gestora, locatario, devedor_cri, spe, externo}.
   - `tipo` da relação ∈ {subscricao_emissao_acima, troca_de_cotas, venda_paga_em_cotas, aquisicao_paga_em_cotas, contraprestacao_contratada, cri_devedor_comum, locatario_compartilhado, mesma_gestora_transacao, transferencia_portfolio, aporte_de_caixa, emprestimo_cri_intra, outro_vinculo}.
   - `data`, `valor` (R$), `fluxo` ∈ {deu_favor, recebeu_favor, reciproco, neutro}.
   - `favorAberto`: true se a operação foi unilateral e nenhuma recíproca foi documentada nos 12 meses seguintes.
   - `agioSobreMercado`: `{presente, valorPercent, leituraMercado}` quando o tipo envolve subscrição/troca de cotas.
   - `mesmaGestora`: true quando ambos os lados têm a mesma gestora (compare `gestora.nome` normalizado).
   - `severidadeConflito` ∈ {alta, media, baixa, inexistente}. Alta quando: mesma gestora + ágio > 5%; OU aporte de caixa direto; OU aquisição que alivia outro fundo da casa.
   - `descricao` (HTML factual) e `leituraInterpretativa` (HTML curto sobre o que o cotista deve observar).
   - `fontes[]`: cada fonte tem `documento`, `docId` real do dossiê, `trecho` (frase curta extraída).

   **REGRAS DURAS para `relacoes[]`:**
   - Se não há fonte documental (docId), NÃO registra. Vibe não conta.
   - Severidade ALTA exige pelo menos UM critério objetivo (ágio quantificado, mesma gestora, aporte de caixa).
   - Pelo menos sempre verificar: subscrição em emissão de outro FII; pagamento de transação em cotas; contraparte recorrente em CRI/locatário; transação intra-casa (mesma gestora).
   - Se nada foi identificado, devolver `"relacoes": []` (array vazio) — NÃO omitir o campo.

**conclusao** — `paragrafos` (3-5), `pontosFortes` (3-5), `pontosDeAtencao` (3-5),
   `conclusaoFinal` (1 parágrafo de fecho).

# REANÁLISE — quando há análise anterior

Se houver `# ANÁLISE ANTERIOR` no input, **VOCÊ É O AUTOR DESSE JSON**. Aplique:

1. **Mantenha o que continua válido.** A maioria das seções (`gestora`, `taxas`, `timeline.periodos[]` passados, `valuation.eventosValuation[]` passados) NÃO deve mudar a menos que documento novo contradiga.
2. **Atualize com documentos novos:** `indicadores`, `dividendos.historico[]`, `dividendos.sustentabilidade`, `valuation.precoJustoMercado` (use a Selic atual de `extrasValuation.macro`), `valuation.expectativa`.
3. **Mude tese só com motivo concreto.** Se a recomendação muda (COMPRA → VENDA, MANTER → COMPRA, etc.), preencha `meta.mudancaTese`:
   ```json
   "mudancaTese": {
     "anteriorVeredicto": "MANTER",
     "anteriorNota": 6.5,
     "anteriorData": "YYYY-MM-DD",
     "atualVeredicto": "VENDA",
     "motivo": "explicação concreta com fato datado",
     "documentosCausadores": ["docId1", "docId2"]
   }
   ```
4. **Se a tese NÃO mudou**, NÃO inclua `mudancaTese`. Não invente mudança por reanalisar.

# CONSISTÊNCIA CRUZADA — REGRA-MÃE

A análise é UMA SÓ NARRATIVA. Cada seção conta a mesma história. ANTES de devolver o JSON, valide internamente:

- C1: nota 0–4 ⇒ veredicto VENDA/EM_ANALISE; 5–7 ⇒ MANTER; 8–10 ⇒ COMPRA.
- C2: cor casa com veredicto (COMPRA=emerald, MANTER=amber, VENDA=red, EM_ANALISE=slate).
- C3: `meta.sentimento` casa com veredicto (otimista/neutro/pessimista).
- C4: `dividendoStatus = pressao_imediata` ⇒ `expectativa.curto.direcao` NÃO pode ser alta.
- C5: `dividendos.sintese.tendencia` em queda ⇒ `expectativa.medio.direcao` NÃO pode ser alta_forte.
- C6: `precoJustoMercado.valor` entre 0.7× e 1.5× da cotação atual.
- C7: largura da `precoJustoMercado.faixa` entre 3% e 15%.
- C8: pesos de `precoJustoMercado.componentes` (sem A4) somam ~1.0.
- C9: `expectativa.{h}.precoEsperado` dentro da `faixa` daquele horizonte.
- C11: cada catalisador em `expectativa.*.catalisadores[]` cita `docId` ou fonte macro pública.
- C14: `conclusao.conclusaoFinal` cita o veredicto compatível com `recomendacao.veredicto`.
- C17: `precoJustoMercado.comparacaoComCotacao.cotacaoAtual = indicadores.cotacao`.
- `pontosFortes` e `pontosAtencao` NÃO podem ter afirmações que se contradigam (ex: "gestora top-3" + "gestora inexperiente").
- `tese.paraQuem` e `tese.naoParaQuem` não conflitam.

Se uma dessas regras não puder ser respeitada, ajuste o JSON antes de devolver. NÃO devolva análise com contradição interna.

# OUTPUT

Devolva APENAS o JSON do FII, válido, sem markdown nem texto antes/depois.
Sem ``` `json `, sem comentários. JSON puro.
"""


def _carregar_exemplo() -> dict:
    return json.loads(EXEMPLO_BTAL11.read_text(encoding="utf-8"))


def _carregar_serie_csv(path: Path, max_rows: int = 400) -> list[dict] | None:
    """Carrega CSV como lista de dicts. Reamostra se exceder max_rows (mantém início, fim,
    e amostragem uniforme do meio) — evita gastar tokens em série densa."""
    if not path.exists():
        return None
    import csv as _csv
    rows: list[dict] = []
    with path.open(encoding="utf-8") as f:
        for r in _csv.DictReader(f):
            rows.append(r)
    if len(rows) <= max_rows:
        return rows
    # Reamostragem: sempre primeiro e último, e amostras uniformes do meio
    step = max(1, len(rows) // (max_rows - 2))
    sampled = [rows[0]] + rows[step::step][:max_rows - 2] + [rows[-1]]
    return sampled[:max_rows]


def _carregar_extras_valuation(ticker: str) -> dict:
    """Anexa séries históricas + macro + pares ao dossiê para o LLM produzir Valuation v2."""
    extras: dict[str, Any] = {}
    pasta_fii = FIIS_DIR / ticker.lower()

    pp = pasta_fii / "historico_precos.csv"
    if pp.exists():
        meta_pp = pasta_fii / "historico_precos.meta.json"
        extras["historicoPrecos"] = {
            "meta": json.loads(meta_pp.read_text(encoding="utf-8")) if meta_pp.exists() else None,
            "amostra": _carregar_serie_csv(pp, max_rows=300),
        }

    vp = pasta_fii / "historico_vp.csv"
    if vp.exists():
        meta_vp = pasta_fii / "historico_vp.meta.json"
        extras["historicoVp"] = {
            "meta": json.loads(meta_vp.read_text(encoding="utf-8")) if meta_vp.exists() else None,
            "amostra": _carregar_serie_csv(vp, max_rows=200),
        }

    if MACRO_PATH.exists():
        extras["macro"] = json.loads(MACRO_PATH.read_text(encoding="utf-8"))

    if PARES_PATH.exists():
        pares = json.loads(PARES_PATH.read_text(encoding="utf-8"))
        # Recorta para o subsegmento provável + lista de subsegmentos disponíveis
        idx = pares.get("indiceTicker") or {}
        ticker_up = ticker.upper()
        sub_atual = idx.get(ticker_up)
        extras["pares"] = {
            "subsegmentoSugerido": sub_atual,
            "subsegmentosDisponiveis": list(pares.get("subsegmentos", {}).keys()),
            "metaPesos": pares.get("metaPesos"),
            "subsegmentoFundo": pares.get("subsegmentos", {}).get(sub_atual) if sub_atual else None,
            # Para classificação alternativa, lista todas as estatísticas
            "todosSubsegmentos": {
                slug: {
                    "nome": info.get("nome"),
                    "premioRiscoSegmento": info.get("premioRiscoSegmento"),
                    "estatisticas": info.get("estatisticas"),
                    "tickers": info.get("tickers", [])[:15],
                }
                for slug, info in pares.get("subsegmentos", {}).items()
            },
        }

    return extras


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
        "extrasValuation": _carregar_extras_valuation(meta["ticker"]),
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
    # Análise anterior (se houver) — preserva narrativa entre reanálises
    analise_anterior = None
    json_path = FIIS_DIR / f"{ticker.lower()}.json"
    if json_path.exists():
        try:
            anterior = json.loads(json_path.read_text(encoding="utf-8"))
            # Filtra para o que importa em reanálise — pula chartLabels longos etc.
            analise_anterior = {
                "meta": anterior.get("meta"),
                "indicadores": anterior.get("indicadores"),
                "recomendacao": anterior.get("recomendacao"),
                "quickStats": anterior.get("quickStats"),
                "pontosAtencao": anterior.get("pontosAtencao"),
                "gestora": anterior.get("gestora"),
                "taxas": anterior.get("taxas"),
                "tese": anterior.get("tese"),
                "timeline": anterior.get("timeline"),
                "valuation": {
                    k: v for k, v in (anterior.get("valuation") or {}).items()
                    if k in ("schema", "dataAnalise", "pvp", "spread",
                             "precoJustoMercado", "expectativa", "paresComparaveis",
                             "eventosValuation")
                },
                "dividendos": {
                    k: v for k, v in (anterior.get("dividendos") or {}).items()
                    if k in ("sustentabilidade", "sintese", "guidance",
                             "eventosFuturos", "alertas", "projecaoDy")
                },
                "conclusao": anterior.get("conclusao"),
            }
        except Exception as e:
            print(f"  [warn] falha ao ler análise anterior: {e}")

    anterior_section = ""
    if analise_anterior:
        anterior_section = (
            f"\n\n# ANÁLISE ANTERIOR — VOCÊ É O AUTOR DESTE JSON\n\n"
            f"Esta análise foi feita em {(analise_anterior.get('meta') or {}).get('dataAnalise', '?')}, "
            f"baseada em {(analise_anterior.get('meta') or {}).get('totalDocumentos', '?')} documentos. "
            f"Ela é o ponto de partida da reanálise atual. Mantenha o que continua válido. "
            f"Mude apenas o que mudou e SÓ com motivo concreto datado.\n\n"
            f"```json\n{json.dumps(analise_anterior, ensure_ascii=False, indent=2)[:80000]}\n```\n\n"
            f"REGRAS DE REANÁLISE:\n"
            f"- Se você mantiver o veredicto, NÃO inclua `meta.mudancaTese`.\n"
            f"- Se mudar o veredicto, OBRIGATÓRIO preencher `meta.mudancaTese` com `documentosCausadores[]` (docIds dos novos docs que justificam).\n"
            f"- `valuation.eventosValuation[]` passados que já estavam no JSON anterior devem PERMANECER (eventos passados não somem). Apenas adicione novos eventos.\n"
            f"- `timeline.periodos[]` passados são imutáveis — apenas estenda com períodos novos.\n"
            f"- `gestora`, `taxas` mudam SÓ se houver documento explícito (mudança de gestora, redução de taxa).\n"
        )

    extras = dossie.get("extrasValuation") or {}
    extras_section = ""
    if extras:
        extras_section = (
            f"\n\n# EXTRAS DE VALUATION v2 — use para popular a chave `valuation` (schema v2)\n\n"
            f"```json\n{json.dumps(extras, ensure_ascii=False, indent=2)[:60000]}\n```\n\n"
            f"INSTRUÇÕES OBRIGATÓRIAS:\n"
            f"- Use `extrasValuation.macro.selicAtual` e `extrasValuation.pares.subsegmentoFundo.premioRiscoSegmento` no componente A1 do `precoJustoMercado`.\n"
            f"- Use `extrasValuation.pares.subsegmentoFundo.estatisticas` (medianas) nos componentes A2 e A3.\n"
            f"- Em `historicoPrecos.csvPath` aponte para `data/fiis/{ticker.lower()}/historico_precos.csv` (já gerado).\n"
            f"- Em `historicoVp.csvPath` aponte para `data/fiis/{ticker.lower()}/historico_vp.csv` (já gerado).\n"
            f"- Em `expectativa.medio` e `expectativa.longo`, considere `extrasValuation.macro.selicProjetada12m` (projeção Focus do BCB) como catalisador macro.\n"
        )

    user_msg = (
        f"Gere a análise completa do FII **{ticker}** ({dossie.get('descricaoFundo','')}).\n\n"
        f"# EXEMPLO DO SCHEMA — use exatamente esta estrutura, adaptando os valores\n\n"
        f"```json\n{json.dumps(exemplo, ensure_ascii=False, indent=2)[:50000]}\n```\n\n"
        f"# DOSSIÊ DO {ticker} — {len(dossie['documentos'])} documentos\n\n"
        f"```json\n{json.dumps({k: v for k, v in dossie.items() if k != 'extrasValuation'}, ensure_ascii=False, indent=2)[:600000]}\n```"
        f"{anterior_section}"
        f"{extras_section}\n\n"
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
    parsed = json.loads(m.group(0))

    # Acumula custo: o claude CLI retorna `total_cost_usd` no envelope (modo --output-format json)
    custo_usd = envelope.get("total_cost_usd") or envelope.get("cost_usd") or 0.0
    if custo_usd:
        try:
            parsed.setdefault("_chamadaCustoUsd", float(custo_usd))
        except Exception:
            pass
    return parsed


SYSTEM_CORRIGIR_PATCHES = """Você é o autor da análise JSON do FII. Foram encontradas inconsistências internas que precisam ser corrigidas SEM reescrever a análise inteira — só patches pontuais.

REGRAS:
1. Devolva um JSON com formato `{"patches": [{"path": "caminho.json.dot", "value": <novo_valor>, "motivo": "<por que>"}]}`.
2. `path` é o caminho jq-like — exemplos: "recomendacao.veredicto", "valuation.precoJustoMercado.componentes[1].peso", "meta.mudancaTese".
3. Mude APENAS o necessário para resolver as violações listadas. NÃO mexa em outros campos.
4. Se a violação é "pesos não somam 1.0", redistribua pesos PROPORCIONALMENTE para somar 1.0, mantendo a hierarquia (A1 maior que A2 maior que A3).
5. Se a violação é "veredicto incompatível com nota", corrija o VEREDICTO (não a nota — a nota é fruto da análise).
6. Se a violação é "cor incompatível com veredicto", corrija a COR.
7. Se a violação é "docId inexistente", remova o evento OU mude docId para um válido (priorize remover).
8. Se a violação é "expectativa.curto.precoEsperado fora da faixa", ajuste precoEsperado para dentro da faixa (não mexa na faixa).
9. Se a violação é "comparacaoComCotacao.cotacaoAtual difere de indicadores.cotacao", use o valor de indicadores.cotacao.
10. Devolva APENAS o objeto `{"patches": [...]}`. Sem markdown, sem comentários adicionais.
"""


def _aplicar_patches(d: dict, patches: list[dict]) -> dict:
    """Aplica patches recebidos do LLM ao JSON.

    `path` aceita: chave simples (a), dot (a.b), array (a[0].b), array por nome (a[id=A1].peso).
    Retorna o JSON modificado in-place.
    """
    for p in patches:
        path = p.get("path")
        value = p.get("value")
        if not path:
            continue
        # Tokeniza
        tokens = re.findall(r"[\w-]+|\[\d+\]|\[\w+=[^\]]+\]", path)
        cur = d
        for i, tk in enumerate(tokens):
            is_last = i == len(tokens) - 1
            if tk.startswith("[") and tk.endswith("]"):
                inner = tk[1:-1]
                if inner.isdigit():
                    idx = int(inner)
                    if not isinstance(cur, list) or idx >= len(cur):
                        break
                    if is_last:
                        cur[idx] = value
                    else:
                        cur = cur[idx]
                elif "=" in inner:
                    k, v = inner.split("=", 1)
                    if not isinstance(cur, list):
                        break
                    found = next((it for it in cur if isinstance(it, dict) and str(it.get(k)) == v), None)
                    if not found:
                        break
                    if is_last:
                        # substituir item inteiro? não — não faz sentido para `[id=A1]`
                        # nesse caso o user tem que continuar o path
                        break
                    cur = found
                else:
                    break
            else:
                if is_last:
                    if isinstance(cur, dict):
                        cur[tk] = value
                else:
                    if isinstance(cur, dict):
                        if tk not in cur or not isinstance(cur[tk], (dict, list)):
                            cur[tk] = {} if not (i + 1 < len(tokens) and tokens[i + 1].startswith("[")) else []
                        cur = cur[tk]
                    else:
                        break
    return d


def _chamar_opus_corrigir(ticker: str, fii_json: dict, violacoes: list[dict]) -> list[dict]:
    """2ª passada — pede ao Opus apenas patches para resolver violações altas."""
    payload = {"json_atual": fii_json, "violacoes": violacoes}
    user_msg = (
        f"FII {ticker}. Foram encontradas {len(violacoes)} inconsistências de severidade alta. "
        f"Devolva APENAS os patches necessários para resolver, sem reescrever a análise toda.\n\n"
        f"```json\n{json.dumps(payload, ensure_ascii=False, indent=2)[:200000]}\n```"
    )
    cmd = [
        "claude", "--print",
        "--permission-mode", "bypassPermissions",
        "--output-format", "json",
        "--model", MODELO,
        "--system-prompt", SYSTEM_CORRIGIR_PATCHES,
    ]
    proc = subprocess.run(cmd, input=user_msg, capture_output=True, text=True, timeout=600)
    if proc.returncode != 0:
        print(f"  [warn] Opus correção falhou: {proc.stderr[:200]}")
        return []
    envelope = json.loads(proc.stdout)
    raw = (envelope.get("result") or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$", "", raw)
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        return []
    try:
        return json.loads(m.group(0)).get("patches", [])
    except json.JSONDecodeError:
        return []


def _auditar_e_corrigir(ticker: str, fii_json: dict, json_path: Path) -> dict:
    """Roda auditor e, se houver violações altas, dispara correção via patches.

    Retorna o JSON final com `meta.consistencyWarnings[]` para violações de severidade
    media/baixa que não foram corrigidas.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from auditar_consistencia import auditar

    relatorio = auditar(ticker)
    violacoes = relatorio.get("violacoes", [])
    altas = [v for v in violacoes if v["severidade"] == "alta"]
    medias_baixas = [v for v in violacoes if v["severidade"] != "alta"]

    if altas:
        print(f"  [audit] {len(altas)} violação(ões) ALTA encontrada(s) — tentando correção via patches…")
        for v in altas:
            print(f"    - {v['codigo']}: {v['mensagem']}")
        patches = _chamar_opus_corrigir(ticker, fii_json, altas)
        if patches:
            print(f"  [audit] aplicando {len(patches)} patch(es)…")
            fii_json = _aplicar_patches(fii_json, patches)
            json_path.write_text(json.dumps(fii_json, indent=2, ensure_ascii=False), encoding="utf-8")
            # re-auditar
            relatorio = auditar(ticker)
            altas2 = [v for v in relatorio.get("violacoes", []) if v["severidade"] == "alta"]
            if altas2:
                print(f"  [audit] {len(altas2)} violação(ões) ALTA persistente(s) após correção:")
                for v in altas2:
                    print(f"    - {v['codigo']}: {v['mensagem']}")
            else:
                print(f"  [audit] todas as violações ALTA foram corrigidas")
            medias_baixas = [v for v in relatorio.get("violacoes", []) if v["severidade"] != "alta"]
        else:
            print(f"  [audit] LLM não devolveu patches válidos — violações persistem")

    # Anexa avisos médias/baixas não corrigidos como meta.consistencyWarnings
    if medias_baixas:
        if "meta" not in fii_json:
            fii_json["meta"] = {}
        fii_json["meta"]["consistencyWarnings"] = [
            {"codigo": v["codigo"], "severidade": v["severidade"],
             "campo": v.get("campo"), "mensagem": v["mensagem"]}
            for v in medias_baixas
        ]
        json_path.write_text(json.dumps(fii_json, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  [audit] {len(medias_baixas)} aviso(s) média/baixa anexado(s) em meta.consistencyWarnings")

    return fii_json


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


def _coletar_precos_pares_fof(ticker: str) -> None:
    """Para FoFs: coleta cotação histórica de cada FII detido em ativos[].

    Lê o JSON anterior (se existir) buscando portfolio.ativos com tipo=fii e
    chama o coletor para cada ticker, garantindo que historico_precos.csv exista
    para o renderer calcular VP em tempo real.
    """
    json_path = FIIS_DIR / f"{ticker.lower()}.json"
    if not json_path.exists():
        return
    try:
        d = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception:
        return
    portfolio = d.get("portfolio") or {}
    if portfolio.get("tipoFundo") != "fof":
        return
    pares = sorted({
        (a.get("ticker") or "").upper()
        for a in (portfolio.get("ativos") or [])
        if a.get("tipo") == "fii" and a.get("ticker")
    })
    pares = [p for p in pares if p and p != ticker.upper()]
    if not pares:
        return
    print(f"  [pre-coleta] FoF detectado — coletando preços de {len(pares)} pares: {', '.join(pares[:8])}{'…' if len(pares)>8 else ''}")
    scripts_pacote = ROOT / "scripts"
    try:
        subprocess.run(
            ["python3", "-m", "cotacoes.coletar_historico",
             "--tickers", ",".join(pares), "--frequencia", "semanal", "--sleep", "0.3"],
            cwd=str(scripts_pacote), check=False, timeout=600,
        )
    except Exception as e:
        print(f"    [warn] coleta pares FoF falhou: {e}")


def _pre_coletar_valuation(ticker: str) -> None:
    """Roda os scripts de coleta de séries históricas e macro antes da análise.

    Falhas individuais não abortam — o LLM degrada graciosamente para Valuation v1
    quando os dados não estão disponíveis (regra dura 8 do playbook).
    """
    scripts_pacote = ROOT / "scripts"
    print(f"  [pre-coleta] cotação histórica…")
    try:
        subprocess.run(
            ["python3", "-m", "cotacoes.coletar_historico", "--ticker", ticker, "--frequencia", "semanal"],
            cwd=str(scripts_pacote), check=False, timeout=120,
        )
    except Exception as e:
        print(f"    [warn] coletar_historico falhou: {e}")

    print(f"  [pre-coleta] VP histórico…")
    try:
        subprocess.run(
            ["python3", "-m", "cotacoes.extrair_vp_historico", "--ticker", ticker],
            cwd=str(scripts_pacote), check=False, timeout=60,
        )
    except Exception as e:
        print(f"    [warn] extrair_vp_historico falhou: {e}")

    # macro só atualiza se snapshot tem mais de 7 dias
    macro_velho = True
    if MACRO_PATH.exists():
        try:
            snap = json.loads(MACRO_PATH.read_text(encoding="utf-8"))
            from datetime import date
            d_snap = datetime.strptime(snap["dataSnapshot"], "%Y-%m-%d").date()
            macro_velho = (date.today() - d_snap).days > 7
        except Exception:
            macro_velho = True
    if macro_velho:
        print(f"  [pre-coleta] macro snapshot (Selic + Focus)…")
        try:
            subprocess.run(
                ["python3", "-m", "cotacoes.macro_snapshot"],
                cwd=str(scripts_pacote), check=False, timeout=60,
            )
        except Exception as e:
            print(f"    [warn] macro_snapshot falhou: {e}")


def _processar(ticker: str, exemplo: dict) -> dict:
    print(f"\n[gerar] {ticker} — pré-coleta Valuation v2…")
    _pre_coletar_valuation(ticker)
    _coletar_precos_pares_fof(ticker)

    print(f"[gerar] {ticker} — carregando dossiê…")
    dossie = _carregar_dossie(ticker)
    if not dossie["documentos"]:
        raise RuntimeError(f"dossiê de {ticker} sem docs com texto extraído")
    extras = dossie.get("extrasValuation", {}) or {}
    print(f"  {len(dossie['documentos'])} docs com texto, "
          f"~{sum(len(d['texto']) for d in dossie['documentos'])//1000}k chars total")
    print(f"  extras: precos={'sim' if extras.get('historicoPrecos') else 'NÃO'}, "
          f"vp={'sim' if extras.get('historicoVp') else 'NÃO'}, "
          f"macro={'sim' if extras.get('macro') else 'NÃO'}, "
          f"pares={'sim' if extras.get('pares') else 'NÃO'}")

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

    # Custo acumulado de análise (USD): preserva total das execuções anteriores
    # somando o custo desta execução (extraído do envelope CLI).
    custo_chamada = float(fii_json.pop("_chamadaCustoUsd", 0) or 0)
    custo_anterior = 0.0
    if json_path_existente := (FIIS_DIR / f"{ticker.lower()}.json"):
        if json_path_existente.exists():
            try:
                ant = json.loads(json_path_existente.read_text(encoding="utf-8"))
                custo_anterior = float(((ant.get("meta") or {}).get("custoAnalise") or {}).get("totalUsd") or 0)
            except Exception:
                custo_anterior = 0.0
    custo_total = round(custo_anterior + custo_chamada, 6)
    n_execucoes_ant = 0
    try:
        n_execucoes_ant = int(((ant.get("meta") or {}).get("custoAnalise") or {}).get("numeroExecucoes") or 0) if 'ant' in dir() else 0
    except Exception:
        pass
    fii_json.setdefault("meta", {})["custoAnalise"] = {
        "totalUsd": custo_total,
        "ultimaChamadaUsd": round(custo_chamada, 6),
        "numeroExecucoes": n_execucoes_ant + (1 if custo_chamada > 0 else 0),
        "ultimaExecucao": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "modelo": MODELO,
    }

    # salva JSON
    json_path = FIIS_DIR / f"{ticker.lower()}.json"
    json_path.write_text(json.dumps(fii_json, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  JSON salvo: {json_path.relative_to(ROOT)}")

    # auditor de consistência + correção via patches (se houver violações altas)
    fii_json = _auditar_e_corrigir(ticker, fii_json, json_path)

    # rebuild do grafo agregado de relações (para tela /fiis/conexoes/)
    try:
        subprocess.run(
            ["python3", str(ROOT / "scripts" / "fundosnet" / "construir_grafo_relacoes.py")],
            check=False, timeout=120,
        )
    except Exception as e:
        print(f"  [warn] construir_grafo_relacoes falhou: {e}")

    # garante página HTML
    html_path = _garantir_pagina_html(ticker, fii_json)
    print(f"  HTML pronto: {html_path.relative_to(ROOT)}")

    # Sincroniza lista mestre data/fiis.json (que a página fiis/ consulta)
    try:
        from consolidar_fiis_json import consolidar
        stats = consolidar()
        print(f"  data/fiis.json sincronizado: {stats['total']} FIIs")
    except Exception as e:
        print(f"  [warn] falha ao consolidar fiis.json: {e}")

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
