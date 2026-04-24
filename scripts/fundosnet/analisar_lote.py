"""Análise em lote de todos os FIIs/Fiagros do universo.

Para cada ticker em data/fiis-optimized/, consolida os documentos otimizados
dos últimos 12 meses + série de dividendos + indicadores estruturados e invoca
Claude Opus 4.7 (1M context) para produzir o JSON de análise completa.

Saídas:
  data/fiis/{TICKER}.json                  # JSON de análise (padrão do site)
  fiis/{TICKER}/index.html                 # página renderizada (criada se não existir)
  data/fundosnet-analise-progresso.json    # progresso do lote
  /tmp/analisar-lote-logs/{TICKER}.log     # log individual

Uso:
  python3 analisar_lote.py                      # todos os pendentes
  python3 analisar_lote.py --workers 3
  python3 analisar_lote.py --apenas HGLG11,MXRF11
  python3 analisar_lote.py --forcar             # ignora data de análise anterior
  python3 analisar_lote.py --max 50             # limita para teste
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path

from paths import DATA, ROOT

FIIS_OPTIMIZED = DATA / "fiis-optimized"
FIIS_JSON = DATA / "fiis"
FIIS_DIR_SITE = ROOT / "fiis"
LIQUIDOS_JSON = DATA / "fundosnet-liquidos.json"
LOG_DIR = Path("/tmp/analisar-lote-logs")
PROGRESSO_FILE = DATA / "fundosnet-analise-progresso.json"

MODELO = "claude-opus-4-7[1m]"  # Opus 4.7 com 1M de contexto
TIMEOUT = 1800  # 30 min por ticker
MAX_ANALISE_IDADE_DIAS = 14  # re-analisa se > 14 dias

# Quantidade máxima de docs por tipo para o contexto da análise
MAX_REL_GERENCIAIS = 15        # últimos 12-15 meses
MAX_FATOS_COMUNICADOS = 12     # últimos 12 meses
MAX_ASSEMBLEIAS = 6
MAX_INFORMES_ANUAIS = 2
MAX_INFORMES_TRIM = 4
MAX_DEMONSTRACOES = 2

# Limite de bytes por documento no payload (evita estourar contexto)
MAX_BYTES_POR_DOC = 50_000


# ---------------------------------------------------------------------------
# SYSTEM PROMPT — Assessor de Investimentos
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Você é um assessor de investimentos brasileiro sênior, especializado em fundos imobiliários (FIIs) e Fiagros, escrevendo análise institucional publicada em www.ricoaospoucos.com.br. Sua missão é produzir um DOSSIÊ COMPLETO sobre o fundo solicitado, baseado EXCLUSIVAMENTE nos documentos oficiais fornecidos.

# REGRAS ABSOLUTAS

1. **Nunca invente dados.** Se um campo não pode ser derivado dos documentos, use null ou omita.
2. **Texto principal é OBJETIVO** — tom de reportagem financeira, sem primeira pessoa, sem opinião.
3. **IMPORTANTE — NÃO emita recomendações de investimento ("COMPRA", "VENDA", "MANTER", etc.):**
   - Este portal apresenta dados e análise objetiva para que o leitor tire suas próprias conclusões.
   - A nota 0-10 (`recomendacao.nota`) é uma **avaliação da qualidade do fundo** (gestão, portfólio, precificação, perspectivas), **NÃO é recomendação**.
   - O campo `recomendacao.veredicto` DEVE ser omitido ou receber o valor `null`. O renderer não o exibe.
   - `recomendacao.resumo` deve ser uma **visão geral analítica** (não um veredicto). Descreve o fundo, situação, pontos positivos e de atenção. SEM dizer "compre", "venda", "mantenha".
   - `conclusao.conclusaoFinal` deve fechar com **síntese objetiva** do que foi analisado e dos trade-offs envolvidos, SEM recomendar ação ao investidor.
   - Em todos os textos, evite frases como "recomendamos", "vale a pena", "boa oportunidade de compra", etc.
4. **Valores em R$ no formato brasileiro:** R$ 1,10 · R$ 7,1 bilhões · R$ 165,74.
5. **Percentuais:** 8,5% (vírgula, sem espaço).
6. **Datas em HTML:** use "16/03/2026" (pt-BR).
7. **HTML com Tailwind** dentro das strings quando destacar valores:
   - Positivos: `<strong class="text-emerald-400">`
   - Negativos: `<strong class="text-red-400">`
   - Neutros/atenção: `<strong class="text-amber-400">`
   - Azul info: `<strong class="text-blue-400">`
8. **Preserve TODOS** os números, datas e fatos relevantes dos documentos.
9. **Contexto macro (fev-abr/2026)**: Selic 15% a.a. em queda esperada, IPCA 4,26% (2025), IFIX em máxima histórica, câmbio em apreciação do real.

# METODOLOGIA DE ANÁLISE

## Preço justo (Gordon Growth Model) — VALOR ÚNICO
- **Fórmula base:** Preço = (DPS anual) / (custo_capital - crescimento)
- **custo_capital** = NTN-B 10 anos (7,0% a.a. real) + prêmio de risco (1,5-3% para FII de qualidade)
- **crescimento** = 2-4% a.a. (inflação média + reajuste contratual)
- Cenário típico: DPS 13,20 / (12% - 3%) = R$ 146,67
- **Valide com:** (a) P/VP histórico do fundo; (b) DY target para o segmento; (c) comparação com peers
- Em **valuation.recomendacoes.valor**: apresente como VALOR ÚNICO (ex.: "R$ 146,70"), não como faixa.
- Na descrição (`valuation.recomendacoes.descricao`) pode explicar cenários e premissas.

## Guidance de dividendos (próximos 6-12 meses)
- Se a gestora publicou guidance oficial, USE-o
- Senão, projete base considerando:
  - Resultado recorrente vs distribuído
  - Efeitos de emissões/aquisições/vendas recentes
  - Amortizações previstas
  - Reservas acumuladas
- Apresente faixa: limite inferior / central / limite superior

## Nota (0-10) — avaliação de qualidade, NÃO recomendação
Avalie 4 eixos, peso igual:
1. **Qualidade da gestão** (experiência, alinhamento, governança)
2. **Qualidade do portfólio** (ocupação, diversificação, locatários, rating imóveis)
3. **Precificação** (P/VP, DY vs peer, desconto patrimonial)
4. **Perspectivas** (catalisadores − riscos, guidance)

A nota é **avaliativa**, não prescritiva:
- **recomendacao.veredicto** = use `null` ou omita. O campo está sendo descontinuado.
- **recomendacao.cor** ainda define a cor dos elementos visuais: use `emerald` (nota ≥ 7,5), `blue` (6,0-7,4), `amber` (4,5-5,9), `orange` (3,0-4,4), `red` (< 3,0).

# SCHEMA DE SAÍDA (JSON ESTRITO)

Retorne APENAS um JSON válido seguindo exatamente esta estrutura. Todos os campos são obrigatórios a menos que indicado (opcional). Use null para campos sem dados.

```json
{
  "meta": {
    "ticker": "XXXX11",
    "nome": "Nome completo do fundo",
    "nomeExtra": "(ex-nome antigo, opcional)",
    "segmento": "Logística | Shopping | Escritórios | Papel (CRI) | Híbrido | Agronegócio | etc",
    "badges": ["3 badges curtas com destaque do fundo"],
    "sentimento": "otimista | neutro | pessimista",
    "dataAnalise": "DD/MM/YYYY",
    "totalDocumentos": 394
  },
  "seo": {
    "title": "TICKER - Análise Completa | Nome",
    "description": "1 frase de 150-160 chars com indicadores-chave",
    "keywords": "ticker, gestora, segmento, dy, ...",
    "ogTitle": "TICKER - ...",
    "ogDescription": "...",
    "twitterTitle": "TICKER - ...",
    "twitterDescription": "..."
  },
  "indicadores": {
    "cotacao": 158.97,
    "cotacaoData": "28/02/2026",
    "pvp": 0.96,
    "pvpDesconto": "4% de desconto | 5% de prêmio",
    "dividendYield": 8.3,
    "dividendoMensal": 1.10,
    "dividendoAnual": 13.20,
    "patrimonioLiquido": "R$ 7,0 Bi",
    "vpCota": 165.74,
    "cotistas": 525000,
    "ocupacao": 97.0,
    "numImoveis": 37
  },
  "recomendacao": {
    "nota": 8.5,
    "veredicto": "COMPRA",
    "cor": "emerald",
    "resumo": "2-3 parágrafos em HTML com destaques em strong colorido. Apresenta tese central, pontos críticos e veredicto claro."
  },
  "quickStats": [
    { "label": "Patrimônio", "valor": "R$ 7,0 Bi", "detalhe": "VP/cota: R$ 165,74", "icone": "building", "corIcone": "blue" },
    { "label": "Rendimento", "valor": "R$ 1,10", "valorSufixo": "/mês", "detalhe": "R$ 13,20/ano | DY 8,3%", "icone": "money", "corIcone": "emerald" },
    { "label": "Ocupação", "valor": "97%", "detalhe": "Vacância 3,0%", "icone": "building", "corIcone": "emerald" },
    { "label": "Cotistas", "valor": "525.069", "detalhe": "42,4 mi cotas", "icone": "users", "corIcone": "purple" }
  ],
  "pontosAtencao": [
    { "titulo": "Título curto", "descricao": "Explicação factual em 2-4 linhas com números", "severidade": "red|orange|amber|emerald" }
  ],
  "gestora": {
    "nome": "Pátria Investimentos",
    "nota": 9.0,
    "notaLabel": "EXCELENTE | BOA | REGULAR | RUIM",
    "stats": [{ "label": "AuM", "valor": "R$ XXX Bi" }, { "label": "Anos de atuação", "valor": "18 anos" }],
    "resumo": "HTML com contextualização objetiva da gestora, track record e alinhamento",
    "link": "../../gestores/nome-gestora/ (se existir)"
  },
  "taxas": {
    "subtitulo": "Texto curto sobre competitividade das taxas",
    "glowCor": "green|amber|red",
    "itens": [
      { "label": "Taxa de Administração", "valor": "0,6% a.a.", "detalhe": "Sobre valor de mercado", "corBorda": "emerald" },
      { "label": "Taxa de Performance", "valor": "N/A ou X%", "detalhe": "...", "corBorda": "amber" },
      { "label": "Liquidez Diária", "valor": "R$ 14,2 MI", "detalhe": "Volume médio", "corBorda": "emerald" }
    ],
    "detalhes": [
      { "label": "Administrador", "valor": "Banco Genial S.A." },
      { "label": "Custódia", "valor": "..." },
      { "label": "Início", "valor": "Março/2011" }
    ]
  },
  "portfolio": {
    "stats": [
      { "label": "Imóveis / CRIs", "valor": "37" },
      { "label": "ABL / PL alocado", "valor": "2,07 mi m²" },
      { "label": "Vacância", "valor": "3,0%", "cor": "emerald" },
      { "label": "WALE / Duration", "valor": "4,0 anos" }
    ],
    "tipologiaChart": {
      "labels": ["Top 4-6 ativos / segmentos"],
      "data": [30, 20, 15, 10, 5],
      "cores": ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]
    },
    "locatarios": [
      { "nome": "Volkswagen", "setor": "Automotivo", "receita": "13% receita", "rating": "Até 2027", "ratingCor": "emerald", "risco": "Baixo", "riscoCor": "emerald" }
    ],
    "riscoNota": "HTML objetivo com resumo do risco de portfólio"
  },
  "timeline": {
    "subtitulo": "Resumo da trajetória histórica",
    "periodos": [
      { "periodo": "Mar/2011", "label": "IPO", "cor": "blue", "descricao": "IPO a R$ 100/cota...", "pontos": [] },
      { "periodo": "Dez/2025", "label": "ATUAL", "cor": "emerald", "descricao": "...", "pontos": ["<strong>Destaque quantificado</strong>", "..."] }
    ],
    "resumoTrajetoria": {
      "titulo": "Resumo da trajetória",
      "texto": "HTML objetivo com contexto evolutivo"
    },
    "crescimento": [
      { "label": "Variação Cota", "valor": "+57%", "detalhe": "R$ 100 → R$ 158,97" },
      { "label": "Total Distribuído", "valor": "R$ XX,XX", "detalhe": "Desde IPO" }
    ]
  },
  "tese": {
    "resumo": "HTML com 1-2 parágrafos apresentando a tese",
    "paraQuem": ["HTML - perfil de investidor 1", "perfil 2", "perfil 3"],
    "naoParaQuem": ["HTML - perfil contrário 1", "perfil 2"]
  },
  "dividendos": {
    "chartLabels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    "chartData": [1.10, 1.10, 1.10, 1.10, 1.10, 1.10, 1.10, 1.10, 1.10, 1.10, 1.10, 1.10],
    "chartCor": "#10b981",
    "chartYMin": 0,
    "chartYMax": 1.5,
    "totaisAnuais": [
      { "ano": "2023", "valor": "R$ 13,60" },
      { "ano": "2024", "valor": "R$ 13,20" },
      { "ano": "2025", "valor": "R$ 14,30" }
    ],
    "guidance": {
      "periodo": "1S2026",
      "faixa": "R$ 1,05 a R$ 1,15",
      "unidade": "por cota / mês"
    },
    "stats": [
      { "label": "Atual", "valor": "R$ 1,10" },
      { "label": "Maior 12m", "valor": "R$ X,XX" },
      { "label": "Menor 12m", "valor": "R$ X,XX" },
      { "label": "Tendência", "valor": "Estável", "cor": "emerald" }
    ]
  },
  "valuation": {
    "pvp": {
      "valor": "0,96",
      "descricao": "HTML com interpretação",
      "detalhes": [
        { "label": "VP/Cota", "valor": "R$ 165,74" },
        { "label": "Preço", "valor": "R$ 158,97", "cor": "emerald" }
      ]
    },
    "spread": {
      "valor": "8,3%",
      "label": "Dividend Yield",
      "cor": "emerald",
      "descricao": "HTML com contexto do yield vs peers"
    },
    "recomendacoes": {
      "valor": "R$ 160-175",
      "label": "Faixa de Preço Justo",
      "cor": "blue",
      "descricao": "HTML explicando a faixa estimada (Gordon + P/VP hist + DY target)"
    }
  },
  "conclusao": {
    "paragrafos": [
      "Parágrafo 1 - contexto e situação atual",
      "Parágrafo 2 - análise técnica/fundamental",
      "Parágrafo 3 - projeções e catalisadores"
    ],
    "pontosFortes": ["5-9 pontos fortes objetivos"],
    "pontosDeAtencao": ["5-9 pontos de atenção objetivos"],
    "conclusaoFinal": "Parágrafo final com OPINIÃO/RECOMENDAÇÃO clara e acionável (aqui é o único lugar onde o assessor dá veredicto final forte)"
  },
  "footer": {
    "dataAnalise": "DD/MM/YYYY",
    "totalDocumentos": 394,
    "disclaimer": "Este material tem caráter exclusivamente informativo e não constitui recomendação de investimento. Rentabilidade passada não é garantia de rentabilidade futura."
  }
}
```

# INSTRUÇÃO FINAL

Responda APENAS com o JSON completo. Nenhum texto antes, nenhum comentário depois. Use exatamente o schema acima. Todos os valores em R$ formatados pt-BR. HTML com Tailwind nas strings quando útil."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_data_br(s: str | None) -> datetime | None:
    if not s:
        return None
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            return datetime.strptime(s[:19 if " " in s else 10], fmt)
        except ValueError:
            continue
    return None


def _parse_data_iso(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.strptime(s[:10], "%Y-%m-%d")
    except ValueError:
        return None


def ja_analisado_recentemente(ticker: str, max_dias: int = MAX_ANALISE_IDADE_DIAS) -> bool:
    p = FIIS_JSON / f"{ticker.lower()}.json"
    if not p.exists():
        return False
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
        data_str = d.get("meta", {}).get("dataAnalise", "") or d.get("footer", {}).get("dataAnalise", "")
        if not data_str:
            return False
        dt = _parse_data_br(data_str)
        if not dt:
            return False
        return (datetime.now() - dt).days < max_dias
    except Exception:
        return False


def _load_mds(ticker: str, limit_por_tipo: dict[str, int]) -> list[dict]:
    """Seleciona os docs-chave dos últimos 12-24 meses."""
    base = FIIS_OPTIMIZED / ticker
    index_path = FIIS_OPTIMIZED.parent / "fiis-raw" / ticker / "meta.json"
    if not index_path.exists():
        return []
    raw_meta = json.loads(index_path.read_text(encoding="utf-8"))
    docs = raw_meta.get("documentos", [])

    # Agrupa por categoria
    def cat(tipo: str) -> str:
        t = (tipo or "").lower()
        if "relatório gerencial" in t or "relatorio gerencial" in t: return "rel_ger"
        if "fato relevante" in t: return "fato_rel"
        if "outros comunicados" in t or "comunicado ao mercado" in t: return "comunicado"
        if "assembleia" in t or "convocação" in t: return "assembleia"
        if "informe anual" in t: return "informe_anual"
        if "informe trimestral" in t: return "informe_trim"
        if "demonstrações" in t: return "demonstracoes"
        return "outro"

    grupos: dict[str, list[dict]] = {}
    for d in docs:
        c = cat(d.get("tipoDocumento"))
        grupos.setdefault(c, []).append(d)

    # Ordena cada grupo por data
    for c in grupos:
        grupos[c].sort(
            key=lambda d: _parse_data_br(d.get("dataEntrega")) or datetime.min,
            reverse=True,
        )

    selecionados: list[dict] = []
    for cat_nome, limite in limit_por_tipo.items():
        for d in grupos.get(cat_nome, [])[:limite]:
            # Lê o .md otimizado
            md_path = base / f"{d['id']}.md"
            if not md_path.exists():
                continue
            try:
                conteudo = md_path.read_text(encoding="utf-8")
            except Exception:
                continue
            if len(conteudo) > MAX_BYTES_POR_DOC:
                conteudo = conteudo[:MAX_BYTES_POR_DOC] + "\n\n[...truncado...]"
            selecionados.append({
                "id": d["id"],
                "tipo": d.get("tipoDocumento"),
                "dataReferencia": d.get("dataReferencia"),
                "dataEntrega": d.get("dataEntrega"),
                "conteudo": conteudo,
            })
    return selecionados


def _build_user_msg(ticker: str) -> tuple[str, dict]:
    """Monta o payload do usuário com todo o contexto."""
    ticker = ticker.upper()

    # 1) Metadados básicos
    raw_meta = json.loads((DATA / "fiis-raw" / ticker / "meta.json").read_text(encoding="utf-8"))
    cnpj = raw_meta.get("cnpj")
    nomePregao = raw_meta.get("nomePregao")
    descricaoFundo = raw_meta.get("descricaoFundo")
    total_docs = raw_meta.get("totalDocumentos", len(raw_meta.get("documentos", [])))

    # 2) Dados do universo líquido (volume, segmento, cotação)
    liq_data = {}
    try:
        liq_json = json.loads(LIQUIDOS_JSON.read_text(encoding="utf-8"))
        for f in liq_json.get("fundos", []):
            if f.get("ticker") == ticker:
                liq_data = f
                break
    except Exception:
        pass

    # 3) Série completa de dividendos
    divs_path = DATA / "fiis-extracted" / ticker / "dividendos.json"
    dividendos = []
    if divs_path.exists():
        try:
            raw = json.loads(divs_path.read_text(encoding="utf-8"))
            for d in raw:
                if d.get("valor_cota") and d.get("data_base"):
                    dividendos.append({
                        "data_base": d["data_base"],
                        "valor": d["valor_cota"],
                    })
            dividendos.sort(key=lambda x: x["data_base"])
        except Exception:
            pass

    # 4) Documentos-chave (mais recentes por categoria)
    docs = _load_mds(ticker, {
        "rel_ger": MAX_REL_GERENCIAIS,
        "fato_rel": MAX_FATOS_COMUNICADOS,
        "comunicado": MAX_FATOS_COMUNICADOS // 2,
        "assembleia": MAX_ASSEMBLEIAS,
        "informe_anual": MAX_INFORMES_ANUAIS,
        "informe_trim": MAX_INFORMES_TRIM,
        "demonstracoes": MAX_DEMONSTRACOES,
    })

    # 5) Monta user message
    partes = [
        f"# TICKER: {ticker}",
        f"CNPJ: {cnpj or 'desconhecido'}",
        f"Nome Pregão: {nomePregao or ''}",
        f"Descrição no CVM: {descricaoFundo or ''}",
        f"Total de documentos oficiais analisados: {total_docs}",
        "",
        "## Dados de mercado (referência: abr/2026)",
        f"- Segmento (Fundamentus): {liq_data.get('segmento')}",
        f"- Cotação atual: R$ {liq_data.get('cotacao')}",
        f"- Valor de mercado: R$ {liq_data.get('valorMercado'):,}" if liq_data.get('valorMercado') else "",
        f"- Liquidez média diária: R$ {liq_data.get('liquidezDiaria'):,}" if liq_data.get('liquidezDiaria') else "",
        f"- Dividend Yield (mercado): {liq_data.get('dividendYield')}%",
        f"- P/VP: {liq_data.get('pvp')}",
        f"- FFO Yield: {liq_data.get('ffoYield')}%",
        "",
        f"## Série completa de dividendos ({len(dividendos)} pagamentos)",
    ]
    if dividendos:
        # Lista resumida + detalhada
        from collections import defaultdict
        por_ano = defaultdict(list)
        for d in dividendos:
            por_ano[d["data_base"][:4]].append(d["valor"])
        partes.append("Resumo anual:")
        for ano in sorted(por_ano):
            total = sum(por_ano[ano])
            n = len(por_ano[ano])
            partes.append(f"  - {ano}: {n} pagamentos, total R$ {total:.2f}, média R$ {total/n:.2f}/cota")
        partes.append("\nÚltimos 18 pagamentos (data → valor/cota):")
        for d in dividendos[-18:]:
            partes.append(f"  {d['data_base']} → R$ {d['valor']:.2f}")
    else:
        partes.append("  (nenhum rendimento extraído)")

    partes.append("")
    partes.append("## Documentos oficiais (texto otimizado)")
    for doc in docs:
        partes.append(f"\n---\n### {doc['tipo']} — data_ref={doc.get('dataReferencia')} (id={doc['id']})\n")
        partes.append(doc["conteudo"])

    partes.append("\n---\n\n# INSTRUÇÃO")
    partes.append(
        f"Produza o JSON completo de análise do {ticker} seguindo EXATAMENTE o schema definido no system prompt. "
        f"Use a data de hoje ({datetime.now().strftime('%d/%m/%Y')}) no campo `dataAnalise`. "
        f"Responda APENAS com o JSON, sem texto antes ou depois."
    )

    return "\n".join(p for p in partes if p is not None), {
        "ticker": ticker,
        "total_docs_no_contexto": len(docs),
        "total_dividendos": len(dividendos),
        "tem_liq_data": bool(liq_data),
    }


# ---------------------------------------------------------------------------
# Chamada do Claude CLI
# ---------------------------------------------------------------------------

def _invocar_claude(user_msg: str, ticker: str, log_path: Path) -> tuple[bool, str | None, dict | None]:
    """Invoca claude -p com Opus 4.7 1M. Retorna (ok, raw_json_str, parsed).

    Inclui retry com backoff para erros transientes (rate limit, network).
    """
    cmd = [
        "claude", "--print",
        "--permission-mode", "bypassPermissions",
        "--output-format", "json",
        "--model", MODELO,
        "--system-prompt", SYSTEM_PROMPT,
    ]

    proc = None
    max_tentativas = 3
    backoff = 30  # segundos entre retries
    with log_path.open("w", encoding="utf-8") as logf:
        logf.write(f"# {ticker} — iniciado {datetime.now().isoformat()}\n")
        logf.write(f"# user_msg size: {len(user_msg)} bytes\n\n")
        logf.flush()

        for tentativa in range(1, max_tentativas + 1):
            try:
                proc = subprocess.run(
                    cmd, input=user_msg, capture_output=True, text=True, timeout=TIMEOUT,
                )
                logf.write(f"# tentativa {tentativa} exit_code: {proc.returncode}\n")
                if proc.stderr:
                    logf.write(f"# stderr tentativa {tentativa}:\n{proc.stderr[:2000]}\n")
                logf.flush()
                if proc.returncode == 0:
                    break
                # Falhou — retry com backoff se não for a última
                if tentativa < max_tentativas:
                    logf.write(f"# retry em {backoff}s...\n")
                    logf.flush()
                    time.sleep(backoff)
                    backoff = min(backoff * 2, 180)
            except subprocess.TimeoutExpired:
                logf.write(f"# tentativa {tentativa}: timeout\n")
                if tentativa < max_tentativas:
                    time.sleep(backoff)
                    backoff = min(backoff * 2, 180)
                else:
                    return False, f"timeout após {TIMEOUT}s em {max_tentativas} tentativas", None
            except Exception as e:
                return False, f"erro subprocess: {e}", None

    if proc is None or proc.returncode != 0:
        stderr = proc.stderr if proc else ""
        return False, f"claude CLI falhou após {max_tentativas} tentativas: {stderr[:400]}", None

    try:
        envelope = json.loads(proc.stdout)
    except Exception as e:
        return False, f"parse envelope: {e}", None

    resultado_raw = envelope.get("result") or envelope
    if isinstance(resultado_raw, str):
        m = re.search(r"\{.*\}", resultado_raw, re.DOTALL)
        if not m:
            return False, f"no JSON in result: {resultado_raw[:400]!r}", None
        try:
            parsed = json.loads(m.group(0))
        except Exception as e:
            return False, f"parse JSON interno: {e}", None
    else:
        parsed = resultado_raw

    # Validação básica
    obrigatorios = ["meta", "seo", "indicadores", "recomendacao", "quickStats",
                    "pontosAtencao", "dividendos", "conclusao", "footer"]
    faltando = [k for k in obrigatorios if k not in parsed]
    if faltando:
        return False, f"campos faltando: {faltando}", None

    return True, json.dumps(parsed, ensure_ascii=False), parsed


# ---------------------------------------------------------------------------
# Geração de HTML (se não existir)
# ---------------------------------------------------------------------------

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{ticker} - Análise Completa | {nome}</title>
    <meta name="description" content="{description}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://ricoaospoucos.com.br/fiis/{ticker_lower}/">

    <meta name="keywords" content="{keywords}">
    <meta name="author" content="Rico aos Poucos">

    <meta property="og:title" content="{og_title}">
    <meta property="og:description" content="{og_description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://ricoaospoucos.com.br/fiis/{ticker_lower}/">
    <meta property="og:image" content="https://ricoaospoucos.com.br/icon-512.png">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="Rico aos Poucos">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@ricoaospoucos">
    <meta name="twitter:title" content="{twitter_title}">
    <meta name="twitter:description" content="{twitter_description}">
    <meta name="twitter:image" content="https://ricoaospoucos.com.br/icon-512.png">

    <meta name="theme-color" content="#0d1117">

    <link rel="icon" type="image/png" sizes="192x192" href="../../icon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="../../icon-512.png">
    <link rel="icon" type="image/svg+xml" href="../../favicon.svg">
    <link rel="shortcut icon" href="../../icon-192.png">

    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/fii-page.css">
    <link rel="stylesheet" href="../../css/article-fii.css">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{ticker} - Análise Completa do FII {nome}",
        "description": "{description}",
        "author": {{ "@type": "Organization", "name": "Rico aos Poucos", "url": "https://ricoaospoucos.com.br" }},
        "publisher": {{ "@type": "Organization", "name": "Rico aos Poucos", "logo": {{ "@type": "ImageObject", "url": "https://ricoaospoucos.com.br/icon-512.png" }} }},
        "datePublished": "{date_iso}",
        "dateModified": "{date_iso}",
        "mainEntityOfPage": {{ "@type": "WebPage", "@id": "https://ricoaospoucos.com.br/fiis/{ticker_lower}/" }}
    }}
    </script>
</head>
<body class="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased" data-ticker="{ticker}">
    <div class="page-wrapper">
    <header id="site-header"></header>

    <div id="fii-loading" style="padding: 20px; max-width: 1280px; margin: 0 auto;">
        <div class="fii-skeleton" style="height: 60px; margin-bottom: 16px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        <div class="fii-skeleton" style="height: 280px; margin-bottom: 24px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div class="fii-skeleton" style="height: 120px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
            <div class="fii-skeleton" style="height: 120px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
            <div class="fii-skeleton" style="height: 120px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
            <div class="fii-skeleton" style="height: 120px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        </div>
        <div class="fii-skeleton" style="height: 200px; margin-bottom: 24px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        <div class="fii-skeleton" style="height: 300px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
    </div>

    <div id="fii-root" style="display: none;"></div>

    </div>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../../js/fii-template.js"></script>
    <script>FIITemplate.init({{ dataUrl: '../../data/fiis/{ticker_lower}.json' }});</script>
    <footer id="site-footer"></footer>
    <script defer src="../../js/fii-layout.js"></script>
</body>
</html>
"""


def criar_html_se_nao_existir(ticker: str, analise: dict) -> bool:
    ticker = ticker.upper()
    dst_dir = FIIS_DIR_SITE / ticker.lower()
    dst = dst_dir / "index.html"
    if dst.exists():
        return False
    dst_dir.mkdir(parents=True, exist_ok=True)

    meta = analise.get("meta", {})
    seo = analise.get("seo", {})
    nome = meta.get("nome") or ticker

    content = HTML_TEMPLATE.format(
        ticker=ticker,
        ticker_lower=ticker.lower(),
        nome=nome,
        description=(seo.get("description") or "")[:160],
        keywords=seo.get("keywords") or f"{ticker}, FII, análise",
        og_title=seo.get("ogTitle") or f"{ticker} - Análise Completa",
        og_description=(seo.get("ogDescription") or "")[:200],
        twitter_title=seo.get("twitterTitle") or f"{ticker} - Análise",
        twitter_description=(seo.get("twitterDescription") or "")[:200],
        date_iso=datetime.now().date().isoformat(),
    )
    dst.write_text(content, encoding="utf-8")
    return True


# ---------------------------------------------------------------------------
# Processamento por ticker
# ---------------------------------------------------------------------------

def analisar_um(ticker: str) -> dict:
    ticker = ticker.upper()
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / f"{ticker}.log"
    inicio = time.time()

    try:
        user_msg, stats = _build_user_msg(ticker)
    except Exception as e:
        return {"ticker": ticker, "ok": False, "erro": f"build_msg: {e}",
                "duracao_s": 0, "log": str(log_path)}

    # Valida tamanho do contexto
    if len(user_msg) < 5_000:
        return {"ticker": ticker, "ok": False, "erro": "contexto_muito_pequeno",
                "duracao_s": 0, "log": str(log_path), "stats": stats}

    ok, detalhes, parsed = _invocar_claude(user_msg, ticker, log_path)
    dt = round(time.time() - inicio, 1)

    if not ok:
        return {"ticker": ticker, "ok": False, "erro": detalhes[:200] if detalhes else "?",
                "duracao_s": dt, "log": str(log_path), "stats": stats}

    # Salva o JSON
    FIIS_JSON.mkdir(parents=True, exist_ok=True)
    json_path = FIIS_JSON / f"{ticker.lower()}.json"
    json_path.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")

    # Cria HTML se não existir
    html_criado = criar_html_se_nao_existir(ticker, parsed)

    return {
        "ticker": ticker, "ok": True,
        "duracao_s": dt,
        "bytes_json": json_path.stat().st_size,
        "html_criado": html_criado,
        "log": str(log_path),
        "stats": stats,
    }


def _salvar_progresso(progresso: dict) -> None:
    PROGRESSO_FILE.write_text(json.dumps(progresso, indent=2, ensure_ascii=False),
                              encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Análise em lote via Opus 4.7")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--apenas", help="Tickers específicos (CSV)")
    ap.add_argument("--forcar", action="store_true",
                    help="Ignora dataAnalise recente")
    ap.add_argument("--max", type=int, default=0,
                    help="Limita quantidade (0 = sem limite)")
    args = ap.parse_args()

    # Lista tickers com dossiê otimizado
    todos = sorted(
        d.name for d in FIIS_OPTIMIZED.iterdir()
        if d.is_dir() and (d / "_sumario.json").exists()
    )
    if args.apenas:
        alvo = set(t.strip().upper() for t in args.apenas.split(",") if t.strip())
        todos = [t for t in todos if t.upper() in alvo]

    if not args.forcar:
        pendentes = [t for t in todos if not ja_analisado_recentemente(t)]
        pulados = len(todos) - len(pendentes)
    else:
        pendentes = todos
        pulados = 0

    if args.max > 0:
        pendentes = pendentes[: args.max]

    print(f"[analise-lote] total={len(todos)} pendentes={len(pendentes)} pulados={pulados} workers={args.workers}")
    if not pendentes:
        print("[ok] nada a fazer.")
        return 0

    inicio_global = time.time()
    progresso = {
        "iniciadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "workers": args.workers,
        "modelo": MODELO,
        "total": len(pendentes),
        "concluido": 0,
        "ok": 0, "erro": 0,
        "resultados": [],
    }
    _salvar_progresso(progresso)

    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        futuros = {ex.submit(analisar_um, t): t for t in pendentes}
        for fut in as_completed(futuros):
            t = futuros[fut]
            try:
                r = fut.result()
            except Exception as e:
                r = {"ticker": t, "ok": False, "erro": str(e)[:200]}

            progresso["concluido"] += 1
            if r.get("ok"):
                progresso["ok"] += 1
            else:
                progresso["erro"] += 1
            progresso["resultados"].append(r)
            _salvar_progresso(progresso)

            dt_total = time.time() - inicio_global
            media_s = dt_total / progresso["concluido"]
            eta_s = media_s * (len(pendentes) - progresso["concluido"])
            eta_h = eta_s / 3600
            status = "OK" if r.get("ok") else f"ERR({str(r.get('erro','?'))[:30]})"
            docs_ctx = (r.get("stats") or {}).get("total_docs_no_contexto", "?")
            html_info = " +html" if r.get("html_criado") else ""
            print(f"[{progresso['concluido']:3d}/{len(pendentes)}] {r['ticker']:8s} {status:35s} "
                  f"{r.get('duracao_s',0):.0f}s docs={docs_ctx}{html_info}  "
                  f"| total {dt_total/60:.0f}min ETA {eta_h:.1f}h", flush=True)

    dt = time.time() - inicio_global
    print(f"\n[analise-lote] concluído em {dt/60:.1f}min  ok={progresso['ok']}  erro={progresso['erro']}")

    # Consolida data/fiis.json para a listagem da página fiis/ refletir novos
    try:
        cons = subprocess.run(
            [sys.executable, str(Path(__file__).parent / "consolidar_fiis_json.py")],
            capture_output=True, text=True, timeout=60,
        )
        print(cons.stdout.strip()[-500:])
        if cons.stderr:
            print("stderr:", cons.stderr[-300:])
    except Exception as e:
        print(f"[warn] falhou consolidar_fiis_json: {e}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
