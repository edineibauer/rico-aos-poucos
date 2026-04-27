"""Gera 6 carteiras teóricas recomendadas a partir da base de FIIs analisados.

As 6 carteiras combinam:
  objetivo  ∈ { ganho_capital, renda_passiva }
  perfil    ∈ { agressivo, moderado, conservador }

Cada carteira tem **exatamente 12 ativos**, com pesos diferenciados (não igual,
mas todos > 2% para preservar diversificação) que somam 100%. Cada ativo vem
com `racional` explicando por que está na carteira e qual papel desempenha.

Fluxo:
  1. Lê `data/fiis/*.json` — todos os fundos analisados.
  2. Monta uma ficha resumida de cada (ticker, segmento, dy, pvp, nota,
     veredicto, sustentabilidade, expectativa C/M/L, qualidade, riscos).
  3. Lê `data/macro_snapshot.json` e `data/pares_subsegmento.json` para
     contexto.
  4. Chama Opus 4.7 1M com prompt único pedindo as 6 carteiras estruturadas.
  5. Valida (schema, 12 ativos, soma de pesos, tickers existentes).
  6. Salva em `data/fiis-recomendados.json` (com backup do anterior).

Uso:
    python3 scripts/fundosnet/gerar_carteiras_recomendadas.py
    python3 scripts/fundosnet/gerar_carteiras_recomendadas.py --dry-run   # mostra ficha + tamanho do prompt
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
FIIS_DIR = DATA / "fiis"
MACRO_PATH = DATA / "macro_snapshot.json"
PARES_PATH = DATA / "pares_subsegmento.json"
OUT_PATH = DATA / "fiis-recomendados.json"
BACKUP_DIR = DATA / ".backups"

MODELO = "opus"
TIMEOUT_CLI = 1800

CARTEIRAS = [
    ("ganho_capital", "agressivo"),
    ("ganho_capital", "moderado"),
    ("ganho_capital", "conservador"),
    ("renda_passiva", "agressivo"),
    ("renda_passiva", "moderado"),
    ("renda_passiva", "conservador"),
]


SYSTEM_PROMPT = """Você é o estrategista-chefe de carteiras do Rico aos Poucos. Sua tarefa: montar 6 carteiras teóricas recomendadas de FIIs a partir da base de fundos já analisados pelo site. Cada carteira tem 12 ativos com pesos diferenciados que somam 100%.

# AS 6 CARTEIRAS

## Eixo 1: Ganho de Capital — busca valorização da cota

**Ganho de Capital — Agressivo:** seleciona FIIs com TENDÊNCIA REAL de alta (não fictícia, baseada em dados duros: P/VP descontado em segmento que vai reprecificar, expectativa.medio.direcao = alta_forte, catalisadores documentados). Não considera efeito colateral — aceita que alguns possam dar errado em troca de máxima exposição ao upside.

**Ganho de Capital — Moderado:** mesmo objetivo (ganho de capital), mas considera que o tiro pode sair pela culatra. Evita fundos de ALTO risco (alavancagem alta, inadimplência, dependência de evento único). Foca em fundos com upside controlado e probabilidade alta de não dar prejuízo.

**Ganho de Capital — Conservador:** busca fundos que tendem a reprecificar PARA CIMA mas com PROTEÇÃO de capital. Se o ganho não vier, o fundo se mantém — não dá prejuízo (exceto por evento macro que foge ao controle do ativo). Critério: P/VP descontado + qualidade alta + DY que sustenta enquanto a tese se desenrola.

## Eixo 2: Renda Passiva — busca dividendo perpétuo

**IMPORTANTE para o eixo de Renda Passiva:** considere a INFLAÇÃO. Fundos de papel pagam DY maior nominal mas NÃO corrigem a inflação no principal — em 10 anos o poder de compra erode. Fundos de tijolo têm correção implícita (aluguel reajustado por IPCA + valorização imobiliária). NA RENDA PASSIVA, o "retorno verdadeiro" do tijolo = DY + apreciação patrimonial real (descontada inflação). Se ignorar isso, papel HY domina indevidamente.

**Renda Passiva — Agressivo:** maximiza yield mensal. Aceita exposição a papel HY, fundos com inadimplência leve, gestão ativa agressiva. Pode ter volatilidade de DPS mês a mês — o que importa é o retorno médio anualizado.

**Renda Passiva — Moderado:** busca yield bom (acima da mediana do IFIX) mas sem aceitar prejuízo de capital. Mistura de papel HG com tijolo de qualidade. Volatilidade controlada de DPS, sem fundos com sustentabilidade.dividendoStatus = pressao_imediata ou insustentavel.

**Renda Passiva — Conservador:** PERFIL APOSENTADORIA. O cotista vive desse dividendo — não pode oscilar. Critérios: dividendoStatus = sustentavel_longo, DPS estável (desvio < 8% em 24m), gestoras top-tier, baixíssima alavancagem, fundos com histórico longo. Yield aceito: a partir de 0,7% ao mês (um cara que paga 0,5% ao mês é renda muito baixa — não recomendar). Não busca o maior yield, busca o yield bom mais estável e seguro POSSÍVEL.

# REGRAS DURAS

1. **Cada carteira: EXATAMENTE 12 ativos.** Não 11, não 13.
2. **Pesos diferenciados:** mínimo 3%, máximo 18% por ativo. Soma exatamente 100%. Bons fundos têm peso maior; coadjuvantes peso menor. Não pode ser 8.33% × 12 (peso uniforme = sem opinião).
3. **Diversificação real:** mesmo no agressivo, NÃO concentrar mais de 35% num mesmo subsegmento canônico (ver `pares_subsegmento.json`).
4. **Cada ativo TEM `racional`:** explica em 1-2 frases por que entrou e qual papel desempenha (âncora, satélite, hedge, oportunístico). Sem racional = ativo rejeitado.
5. **Use SOMENTE tickers da base fornecida** (`fundosDisponiveis[]`). Não invente ticker.
6. **Não repita ticker entre as 12 da MESMA carteira** (mas pode repetir entre carteiras diferentes — KNCR11 cabe em renda_passiva conservador E moderado).
7. **Considere os campos da ficha**: `nota`, `veredicto`, `expectativa.medio.direcao`, `dividendoStatus`, `pvp`, `dy`. Veredicto VENDA = NÃO entra em nenhuma carteira. Veredicto EM_ANALISE = só entra se justificar muito.
8. **Evite mistura conceitual.** Carteira de Ganho de Capital não pode ter 80% em fundos de papel HG (que dão renda mas não valorizam). Carteira de Renda Passiva não pode ter 80% em desenvolvimento (que paga pouco hoje para entregar capital lá na frente).

# FORMATO DE SAÍDA

Devolva APENAS o JSON abaixo, sem markdown, sem comentários:

```jsonc
{
  "schema": "v2",
  "ultimaAtualizacao": "YYYY-MM-DD",
  "metodologia": "<HTML curto explicando a metodologia geral>",
  "macroSnapshot": { "selic": 14.75, "selicProjetada12m": 11.0, "ipca12m": null },
  "carteiras": [
    {
      "id": "ganho_capital_agressivo",
      "objetivo": "ganho_capital",
      "perfil": "agressivo",
      "nome": "Ganho de Capital — Agressivo",
      "subtitulo": "frase-síntese de 1 linha",
      "tese": "<HTML 2-3 frases explicando a tese da carteira como um todo, qual perfil de investidor deve usar, qual horizonte>",
      "metricasPonderadas": {
        "dyMedioPonderado": 12.4,
        "pvpMedioPonderado": 0.85,
        "exposicaoSegmento": [
          { "segmento": "papel_high_yield", "pct": 28 },
          { "segmento": "tijolo_logistica_aaa", "pct": 22 }
        ]
      },
      "ativos": [
        {
          "ticker": "DEVA11",
          "peso": 14,
          "papel": "âncora",
          "racional": "<frase explicando por que entra e qual papel cumpre>"
        }
        // ... 11 ativos a mais (12 no total)
      ]
    }
    // ... mais 5 carteiras (6 no total)
  ]
}
```

REGRA DE OURO: se algum critério não tem base nos dados fornecidos, devolva uma carteira mais conservadora em vez de chutar.
"""


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("%", "").replace(" ", "").replace("R$", "")
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _ficha_resumida(ticker: str, d: dict) -> dict:
    """Reduz cada JSON de ~50KB para uma ficha de 0.5-1KB com o que importa para alocação."""
    meta = d.get("meta") or {}
    ind = d.get("indicadores") or {}
    rec = d.get("recomendacao") or {}
    val = d.get("valuation") or {}
    div = d.get("dividendos") or {}
    def _safe_dict(x):
        return x if isinstance(x, dict) else {}
    sust = _safe_dict(div.get("sustentabilidade"))
    sintese = _safe_dict(div.get("sintese"))
    pj = _safe_dict(val.get("precoJustoMercado"))
    exp = _safe_dict(val.get("expectativa"))
    pares = val.get("paresComparaveis") or {}
    if not isinstance(pares, dict):
        pares = {}
    portfolio = d.get("portfolio") or {}
    if not isinstance(portfolio, dict):
        portfolio = {}

    # Calcular DY consolidado se possível
    dy = _f(ind.get("dividendYield"))
    pvp = _f(ind.get("pvp"))
    cot = _f(ind.get("cotacao"))

    return {
        "ticker": ticker,
        "nome": meta.get("nome"),
        "segmento": meta.get("segmento"),
        "tipoFundo": portfolio.get("tipoFundo"),
        "subsegmento": pares.get("subsegmento"),
        "nota": _f(rec.get("nota")),
        "veredicto": rec.get("veredicto"),
        "sentimento": meta.get("sentimento"),
        "indicadores": {
            "cotacao": cot, "pvp": pvp, "dy": dy,
            "dividendoMensal": ind.get("dividendoMensal"),
            "patrimonioLiquido": ind.get("patrimonioLiquido"),
            "vacancia": ind.get("ocupacao") or ind.get("vacancia"),
            "alavancagem": ind.get("alavancagem"),
        },
        "sustentabilidade": {
            "dividendoStatus": sust.get("dividendoStatus"),
            "horizonte": sust.get("horizonte"),
            "status": sust.get("status"),
            "payoutMedio12m": sust.get("payoutMedio12m"),
            "coberturaMeses": sust.get("coberturaMeses"),
        },
        "tendenciaDividendo": sintese.get("tendencia"),
        "precoJusto": {
            "valor": _f(pj.get("valor")),
            "upside": _f(pj.get("upside")),
            "diferencaPct": _f((pj.get("comparacaoComCotacao") or {}).get("diferencaPct")),
        },
        "expectativa": {
            h: {
                "precoEsperado": _f(_safe_dict(exp.get(h)).get("precoEsperado")),
                "direcao": _safe_dict(exp.get(h)).get("direcao"),
            } for h in ("curto", "medio", "longo")
        },
        "pontosFortes": (d.get("conclusao") or {}).get("pontosFortes") or [],
        "pontosAtencao": (d.get("conclusao") or {}).get("pontosDeAtencao")
                         or [p.get("titulo") for p in (d.get("pontosAtencao") or []) if p.get("titulo")],
        "tese": (d.get("tese") or {}).get("resumo"),
    }


def _carregar_universo() -> list[dict]:
    fichas = []
    for jp in sorted(FIIS_DIR.glob("*.json")):
        if jp.parent.name == ".backups":
            continue
        try:
            d = json.loads(jp.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  [warn] falha em {jp.name}: {e}")
            continue
        ticker = (d.get("meta") or {}).get("ticker") or jp.stem.upper()
        # Filtra fundos com indicadores mínimos (cotação e DY) para evitar stubs
        ind = d.get("indicadores") or {}
        if _f(ind.get("cotacao")) is None:
            continue
        fichas.append(_ficha_resumida(ticker, d))
    return fichas


def _ler_macro() -> dict:
    if not MACRO_PATH.exists():
        return {}
    try:
        return json.loads(MACRO_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _ler_pares() -> dict:
    if not PARES_PATH.exists():
        return {}
    try:
        d = json.loads(PARES_PATH.read_text(encoding="utf-8"))
        return {
            "subsegmentos": {
                slug: {
                    "nome": info.get("nome"),
                    "premioRiscoSegmento": info.get("premioRiscoSegmento"),
                    "estatisticas": info.get("estatisticas"),
                }
                for slug, info in (d.get("subsegmentos") or {}).items()
            },
            "indiceTicker": d.get("indiceTicker") or {},
        }
    except Exception:
        return {}


def _validar_carteiras(out: dict, tickers_validos: set[str]) -> list[str]:
    erros: list[str] = []
    if out.get("schema") != "v2":
        erros.append("schema diferente de v2")
    cart = out.get("carteiras")
    if not isinstance(cart, list) or len(cart) != 6:
        erros.append(f"esperadas 6 carteiras, vieram {len(cart) if isinstance(cart, list) else 0}")
        return erros

    ids_esperados = {f"{o}_{p}" for (o, p) in CARTEIRAS}
    ids_vistos = set()
    for c in cart:
        cid = c.get("id")
        if not cid:
            erros.append("carteira sem id")
            continue
        ids_vistos.add(cid)
        if cid not in ids_esperados:
            erros.append(f"id desconhecido: {cid}")
        ativos = c.get("ativos") or []
        if len(ativos) != 12:
            erros.append(f"[{cid}] esperados 12 ativos, vieram {len(ativos)}")
        soma = 0.0
        tickers_carteira = set()
        for a in ativos:
            t = (a.get("ticker") or "").upper()
            if t in tickers_carteira:
                erros.append(f"[{cid}] ticker duplicado: {t}")
            tickers_carteira.add(t)
            if t and t not in tickers_validos:
                erros.append(f"[{cid}] ticker inválido (não está na base): {t}")
            peso = _f(a.get("peso"))
            if peso is None:
                erros.append(f"[{cid}] {t} sem peso")
            else:
                if peso < 2 or peso > 20:
                    erros.append(f"[{cid}] {t} peso fora de [2, 20]: {peso}")
                soma += peso
            if not (a.get("racional") or "").strip():
                erros.append(f"[{cid}] {t} sem racional")
        if abs(soma - 100) > 1.5:
            erros.append(f"[{cid}] soma dos pesos = {soma:.1f} (esperado 100)")
    faltando = ids_esperados - ids_vistos
    if faltando:
        erros.append(f"carteiras faltando: {sorted(faltando)}")
    return erros


def _chamar_opus(payload: dict) -> dict:
    user_msg = (
        f"Monte as 6 carteiras teóricas recomendadas a partir do universo abaixo.\n\n"
        f"# CONTEXTO MACRO\n```json\n{json.dumps(payload['macro'], ensure_ascii=False, indent=2)}\n```\n\n"
        f"# SUBSEGMENTOS CANÔNICOS (referência de diversificação)\n```json\n{json.dumps(payload['pares'], ensure_ascii=False, indent=2)[:30000]}\n```\n\n"
        f"# UNIVERSO DE FUNDOS DISPONÍVEIS — {len(payload['universo'])} FIIs\n"
        f"```json\n{json.dumps(payload['universo'], ensure_ascii=False, indent=2)[:600000]}\n```\n\n"
        f"Devolva APENAS o JSON com as 6 carteiras."
    )

    cmd = [
        "claude", "--print",
        "--permission-mode", "bypassPermissions",
        "--output-format", "json",
        "--model", MODELO,
        "--system-prompt", SYSTEM_PROMPT,
    ]
    print(f"  chamando Opus (prompt ~{len(user_msg)//1000}k chars)…")
    t0 = datetime.now()
    proc = subprocess.run(cmd, input=user_msg, capture_output=True, text=True, timeout=TIMEOUT_CLI)
    elapsed = (datetime.now() - t0).total_seconds()
    print(f"  Opus respondeu em {elapsed:.0f}s")
    if proc.returncode != 0:
        raise RuntimeError(f"claude CLI falhou ({proc.returncode}): {proc.stderr[:300]}")
    envelope = json.loads(proc.stdout)
    raw = (envelope.get("result") or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$", "", raw)
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        raise RuntimeError(f"sem JSON na resposta. Início: {raw[:300]!r}")
    return json.loads(m.group(0))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Só mostra o que iria mandar, sem chamar LLM")
    args = ap.parse_args()

    print("[carteiras] carregando universo de FIIs analisados…")
    universo = _carregar_universo()
    print(f"  {len(universo)} fundos com indicadores válidos")

    macro = _ler_macro()
    pares = _ler_pares()

    payload = {"universo": universo, "macro": macro, "pares": pares}

    if args.dry_run:
        sample = universo[:3]
        print("\n=== AMOSTRA (3 FICHAS) ===")
        print(json.dumps(sample, ensure_ascii=False, indent=2))
        approx_size = len(json.dumps(payload, ensure_ascii=False))
        print(f"\nTamanho payload total: ~{approx_size//1000}k chars (~{approx_size//4000}k tokens)")
        return 0

    out = _chamar_opus(payload)

    tickers_validos = {f["ticker"] for f in universo}
    erros = _validar_carteiras(out, tickers_validos)
    if erros:
        print("\n[validação] PROBLEMAS DETECTADOS:")
        for e in erros:
            print(f"  - {e}")
        # Salva mesmo com erros, mas marca
        out["_validacao"] = {"erros": erros, "rodadoEm": datetime.now().isoformat()}
    else:
        print("\n[validação] ✓ todas as carteiras passaram")

    # Backup do anterior
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    if OUT_PATH.exists():
        ts = datetime.now().strftime("%Y%m%d-%H%M")
        bk = BACKUP_DIR / f"fiis-recomendados-{ts}.json"
        shutil.copy(OUT_PATH, bk)
        print(f"  backup salvo: {bk.relative_to(ROOT)}")

    out["ultimaAtualizacao"] = out.get("ultimaAtualizacao") or datetime.now().strftime("%Y-%m-%d")
    out["totalFundosAnalisados"] = len(universo)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[carteiras] salvo em {OUT_PATH.relative_to(ROOT)}")

    # Resumo final
    print("\n=== RESUMO ===")
    for c in out.get("carteiras", []):
        ativos = c.get("ativos") or []
        print(f"  [{c.get('id'):35}] {len(ativos)} ativos · "
              f"DY {c.get('metricasPonderadas',{}).get('dyMedioPonderado','?')}% · "
              f"P/VP {c.get('metricasPonderadas',{}).get('pvpMedioPonderado','?')}")
    return 0 if not erros else 1


if __name__ == "__main__":
    sys.exit(main())
