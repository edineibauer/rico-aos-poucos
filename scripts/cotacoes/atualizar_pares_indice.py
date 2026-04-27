"""Reconstrói o índice reverso ticker → subsegmento em data/pares_subsegmento.json.

Também recalcula estatísticas do segmento (medianas de P/VP e DY) a partir dos
JSONs em data/fiis/, para alimentar a camada A2/A3 do precoJustoMercado.

Uso:
    python3 scripts/cotacoes/atualizar_pares_indice.py
"""
from __future__ import annotations

import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
PARES_PATH = DATA / "pares_subsegmento.json"
FIIS_DIR = DATA / "fiis"


def _coletar_indicadores(ticker: str) -> dict[str, float | None]:
    p = FIIS_DIR / f"{ticker.lower()}.json"
    if not p.exists():
        return {"pvp": None, "dy": None}
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {"pvp": None, "dy": None}
    ind = d.get("indicadores") or {}

    def _f(v: Any) -> float | None:
        if v is None or v == "":
            return None
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip().replace("%", "").replace(" ", "")
        if "," in s:
            s = s.replace(".", "").replace(",", ".")
        try:
            return float(s)
        except ValueError:
            return None

    return {"pvp": _f(ind.get("pvp")), "dy": _f(ind.get("dividendYield"))}


def main() -> int:
    pares = json.loads(PARES_PATH.read_text(encoding="utf-8"))
    subsegmentos = pares["subsegmentos"]

    indice: dict[str, str] = {}
    for slug, info in subsegmentos.items():
        for ticker in info.get("tickers", []):
            t = ticker.upper()
            if t in indice:
                print(f"[warn] {t} já está em {indice[t]}, sobrescrevendo com {slug}", file=sys.stderr)
            indice[t] = slug

    # Estatísticas por subsegmento
    for slug, info in subsegmentos.items():
        tickers = info.get("tickers", [])
        if not tickers:
            info["estatisticas"] = {"n": 0}
            continue
        pvps: list[float] = []
        dys: list[float] = []
        for t in tickers:
            ind = _coletar_indicadores(t)
            if ind["pvp"] is not None and 0.05 < ind["pvp"] < 3.0:
                pvps.append(ind["pvp"])
            if ind["dy"] is not None and 0 < ind["dy"] < 50:
                dys.append(ind["dy"])

        def _stats(vals: list[float]) -> dict[str, float | int | None]:
            if not vals:
                return {"n": 0, "mediano": None, "min": None, "max": None}
            return {
                "n": len(vals),
                "mediano": round(statistics.median(vals), 4),
                "min": round(min(vals), 4),
                "max": round(max(vals), 4),
            }

        info["estatisticas"] = {
            "n": len(tickers),
            "nComPvp": len(pvps),
            "nComDy": len(dys),
            "pvp": _stats(pvps),
            "dy": _stats(dys),
            "atualizadoEm": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        }

    pares["indiceTicker"] = {
        "_comentario": "Índice reverso ticker → subsegmento. Gerado por scripts/cotacoes/atualizar_pares_indice.py.",
        **{k: v for k, v in sorted(indice.items())},
    }
    pares["atualizadoEm"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    PARES_PATH.write_text(json.dumps(pares, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[pares] {len(indice)} tickers indexados em {len(subsegmentos)} subsegmentos")
    print(f"  arquivo: {PARES_PATH.relative_to(ROOT)}")

    # Top 5 segmentos por pop
    print("\n  pop por segmento:")
    for slug, info in sorted(subsegmentos.items(), key=lambda x: -len(x[1].get("tickers", []))):
        n = len(info.get("tickers", []))
        est = info.get("estatisticas", {})
        pvp = est.get("pvp", {}).get("mediano")
        dy = est.get("dy", {}).get("mediano")
        print(f"    {slug:35} n={n:3} pvp_med={pvp!s:6} dy_med={dy!s:7}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
