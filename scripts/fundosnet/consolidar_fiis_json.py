"""Consolida todos data/fiis/{ticker}.json na lista mestre data/fiis.json.

A página fiis/index.html lê data/fiis.json (lista única com 85+ FIIs em formato
flat). Os arquivos individuais em data/fiis/{ticker}.json têm schema detalhado
(gestora.stats, portfolio, timeline...). Este script faz o mapping e mantém
os dois em sincronia.

Chamado automaticamente ao final de gerar_pagina_fii.py sempre que um FII
novo é gerado, e pode ser rodado manualmente pra reconstruir do zero.
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

from paths import DATA, FIIS_DIR

FIIS_JSON = DATA / "fiis.json"


def _strip_html(s: str) -> str:
    import re
    if not s: return ""
    s = re.sub(r"<[^>]+>", "", str(s))
    return re.sub(r"\s+", " ", s).strip()


def _num(v, default=None):
    try:
        if v is None or v == "N/D": return default
        if isinstance(v, (int, float)): return v
        s = str(v).replace("R$", "").replace(".", "").replace(",", ".").strip()
        return float(s) if s else default
    except Exception:
        return default


def _mapear(ticker: str, d: dict) -> dict:
    """Transforma o JSON detalhado do FII no entry flat esperado por fiis/index.html."""
    meta = d.get("meta") or {}
    ind = d.get("indicadores") or {}
    rec = d.get("recomendacao") or {}
    gest = d.get("gestora") or {}
    taxas = d.get("taxas") or {}
    tese = d.get("tese") or {}
    concl = d.get("conclusao") or {}

    # taxas: flat
    taxas_flat = {
        "administracao": _num(taxas.get("administracao") or taxas.get("administracaoGestaoAnual")),
        "performance": _num(taxas.get("performance") if isinstance(taxas.get("performance"), (int, float))
                            else None, default=0),
        "benchmarkPerformance": taxas.get("benchmarkPerformance") or taxas.get("performanceBase") or "N/A",
        "comentarioTaxas": _strip_html(taxas.get("comentarioTaxas") or taxas.get("subtitulo") or ""),
    }

    # estrategia
    estrategia = {
        "resumo": _strip_html(tese.get("resumo") or rec.get("resumo") or ""),
        "ocupacao": _num(ind.get("ocupacao")),
        "focoGeografico": ind.get("focoGeografico") or "",
        "tipoAtivo": meta.get("segmento") or "",
    }

    # riscos / pontos
    riscos = [_strip_html(r) for r in (tese.get("riscos") or [])]
    if not riscos:
        for pa in d.get("pontosAtencao") or []:
            if pa.get("tipo") == "negativo":
                riscos.append(_strip_html(pa.get("titulo", "")))
    pontos_positivos = [_strip_html(p) for p in (concl.get("pontosFortes") or [])]
    if not pontos_positivos:
        for pa in d.get("pontosAtencao") or []:
            if pa.get("tipo") == "positivo":
                pontos_positivos.append(_strip_html(pa.get("titulo", "")))

    conclusao = {
        "resumo": _strip_html(concl.get("conclusaoFinal") or rec.get("resumo") or ""),
        "paraQuem": _strip_html((tese.get("paraQuem") or [""])[0] if isinstance(tese.get("paraQuem"), list) else tese.get("paraQuem") or ""),
        "naoParaQuem": _strip_html((tese.get("naoParaQuem") or [""])[0] if isinstance(tese.get("naoParaQuem"), list) else tese.get("naoParaQuem") or ""),
    }

    # histórico de eventos
    historico = {"ipoData": None, "eventos": []}
    tl = d.get("timeline") or {}
    for per in (tl.get("periodos") or []):
        historico["eventos"].append({
            "ano": per.get("periodo") or per.get("ano") or "",
            "descricao": _strip_html((per.get("pontos") or [""])[0] if per.get("pontos") else per.get("titulo", "")),
            "impacto": _strip_html(per.get("titulo", "")),
        })

    # tags
    tags = list(meta.get("badges") or [])
    if gest.get("nome"): tags.append(gest["nome"])

    return {
        "id": ticker.lower(),
        "ticker": ticker.upper(),
        "nome": meta.get("nome") or ticker,
        "gestora": gest.get("nome") or "",
        "segmento": (meta.get("segmento") or "").lower().replace(" ", "-")[:30],
        "subsegmento": meta.get("segmento") or "",
        "sentimento": meta.get("sentimento") or "neutro",
        "dataAnalise": meta.get("dataAnalise") or date.today().isoformat(),
        "indicadores": {
            "cotacao": _num(ind.get("cotacao")),
            "pvp": _num(ind.get("pvp")),
            "dividendYield": _num(ind.get("dividendYield") or ind.get("dividendYieldAnual")),
            "dividendoMensal": _num(ind.get("dividendoMensal")),
            "patrimonioLiquido": _num(ind.get("patrimonioLiquido")),
            "liquidezMediaDiaria": _num(ind.get("liquidezMediaDiaria") or ind.get("volumeMensalReais")),
            "cotistas": _num(ind.get("cotistas")),
            "vpCota": _num(ind.get("vpCota") or ind.get("cotaPatrimonial")),
        },
        "taxas": taxas_flat,
        "estrategia": estrategia,
        "riscosEspecificos": riscos[:8],
        "pontosPositivos": pontos_positivos[:8],
        "conclusao": conclusao,
        "historico": historico,
        "tags": tags[:12],
        "tempoLeitura": 10,
        "arquivo": f"{ticker.lower()}/index.html",
        "nota": _num(rec.get("nota")),
        "veredicto": rec.get("veredicto") or "EM ANÁLISE",
        "notaGestora": _num(gest.get("nota")),
    }


def consolidar() -> dict:
    """Lê todos os data/fiis/*.json e monta a estrutura final de data/fiis.json."""
    anterior = {}
    if FIIS_JSON.exists():
        try:
            anterior = json.loads(FIIS_JSON.read_text(encoding="utf-8"))
        except Exception:
            anterior = {}

    entries = []
    ignorados = 0
    for p in sorted(FIIS_DIR.glob("*.json")):
        if p.name.startswith("."): continue
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            ignorados += 1
            continue
        ticker = (d.get("meta") or {}).get("ticker") or p.stem.upper()
        # pula stubs totalmente vazios
        if not (d.get("meta") or {}).get("nome") and not d.get("indicadores"):
            ignorados += 1
            continue
        try:
            entries.append(_mapear(ticker, d))
        except Exception as e:
            print(f"  [warn] erro mapeando {ticker}: {e}")
            ignorados += 1

    out = {
        "ultimaAtualizacao": date.today().isoformat(),
        "versao": anterior.get("versao", "2.0"),
        "segmentos": anterior.get("segmentos", []),
        "sentimentos": anterior.get("sentimentos", {}),
        "fiis": entries,
    }
    FIIS_JSON.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    return {"total": len(entries), "ignorados": ignorados}


def main() -> int:
    stats = consolidar()
    print(f"[consolidar] data/fiis.json atualizado — {stats['total']} FIIs ({stats['ignorados']} ignorados)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
