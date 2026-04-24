"""Orquestrador de mineração em massa.

Lê data/fundosnet-liquidos.json e executa minerar_backfill.py para cada ticker
com CNPJ, paralelizando N tickers simultâneos. Idempotente: pula tickers
que já têm meta.json com modo=backfill.

Uso:
  python3 minerar_lote.py                     # 3 workers, todos os com CNPJ
  python3 minerar_lote.py --workers 2         # 2 workers
  python3 minerar_lote.py --apenas HGLG11,TRXF11   # só tickers específicos
  python3 minerar_lote.py --refazer           # ignora já minerados
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import date, datetime
from pathlib import Path

from paths import DATA

LIQUIDOS = DATA / "fundosnet-liquidos.json"
FIIS_RAW = DATA / "fiis-raw"
LOG_DIR = Path("/tmp/minerar-lote-logs")
RESULT_FILE = DATA / "fundosnet-lote-progresso.json"

SCRIPT_BACKFILL = Path(__file__).parent / "minerar_backfill.py"


def ja_minerado(ticker: str, modo_esperado: str = "backfill") -> bool:
    p = FIIS_RAW / ticker.upper() / "meta.json"
    if not p.exists():
        return False
    try:
        m = json.loads(p.read_text(encoding="utf-8"))
        return m.get("modo") == modo_esperado and m.get("totalDocumentos", 0) > 0
    except Exception:
        return False


def rodar_um(ticker: str, cnpj: str) -> dict:
    ticker = ticker.upper()
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / f"{ticker}.log"
    inicio = time.time()
    try:
        with log_path.open("w", encoding="utf-8") as logf:
            logf.write(f"# {ticker} — CNPJ {cnpj} — iniciado {datetime.now().isoformat()}\n")
            logf.flush()
            proc = subprocess.run(
                [sys.executable, "-u", str(SCRIPT_BACKFILL), ticker, cnpj,
                 "--desde", "2005", "--ate", str(date.today().year)],
                stdout=logf, stderr=subprocess.STDOUT,
                cwd=str(SCRIPT_BACKFILL.parent),
                timeout=3600,
            )
        dt = time.time() - inicio
        meta_path = FIIS_RAW / ticker / "meta.json"
        docs = 0
        if meta_path.exists():
            try:
                docs = json.loads(meta_path.read_text(encoding="utf-8")).get("totalDocumentos", 0)
            except Exception:
                pass
        return {"ticker": ticker, "ok": proc.returncode == 0,
                "docs": docs, "duracao_s": round(dt, 1), "log": str(log_path)}
    except subprocess.TimeoutExpired:
        return {"ticker": ticker, "ok": False, "erro": "timeout_1h",
                "duracao_s": round(time.time() - inicio, 1), "log": str(log_path)}
    except Exception as e:
        return {"ticker": ticker, "ok": False, "erro": str(e)[:200],
                "duracao_s": round(time.time() - inicio, 1), "log": str(log_path)}


def _salvar_progresso(progresso: dict) -> None:
    RESULT_FILE.write_text(json.dumps(progresso, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Mineração em lote de FIIs/Fiagros líquidos")
    ap.add_argument("--workers", type=int, default=3,
                    help="Quantos tickers simultâneos (default 3 = 12 conexões totais)")
    ap.add_argument("--apenas", help="Apenas estes tickers (CSV)")
    ap.add_argument("--refazer", action="store_true",
                    help="Não pular tickers já minerados")
    ap.add_argument("--ordenar", choices=["ticker", "liquidez"], default="liquidez",
                    help="Ordem de processamento (default liquidez desc)")
    args = ap.parse_args()

    universo = json.loads(LIQUIDOS.read_text(encoding="utf-8"))
    fundos = [f for f in universo["fundos"] if f.get("cnpj")]

    if args.apenas:
        alvo = set(t.strip().upper() for t in args.apenas.split(",") if t.strip())
        fundos = [f for f in fundos if f["ticker"].upper() in alvo]

    if args.ordenar == "liquidez":
        fundos.sort(key=lambda f: -f.get("liquidezDiaria", 0))
    else:
        fundos.sort(key=lambda f: f["ticker"])

    if not args.refazer:
        pendentes = [f for f in fundos if not ja_minerado(f["ticker"])]
        pulados = len(fundos) - len(pendentes)
    else:
        pendentes = fundos
        pulados = 0

    print(f"[lote] total elegíveis: {len(fundos)}  | pendentes: {len(pendentes)}  | já minerados: {pulados}  | workers: {args.workers}")
    if not pendentes:
        print("[lote] nada a fazer.")
        return 0

    LOG_DIR.mkdir(parents=True, exist_ok=True)

    progresso = {
        "iniciadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "workers": args.workers,
        "total": len(pendentes),
        "concluido": 0,
        "ok": 0,
        "erro": 0,
        "resultados": [],
    }
    _salvar_progresso(progresso)

    inicio_global = time.time()

    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        futuros = {ex.submit(rodar_um, f["ticker"], f["cnpj"]): f for f in pendentes}
        for fut in as_completed(futuros):
            f = futuros[fut]
            try:
                res = fut.result()
            except Exception as e:
                res = {"ticker": f["ticker"], "ok": False, "erro": str(e)[:200]}

            progresso["concluido"] += 1
            if res.get("ok"):
                progresso["ok"] += 1
            else:
                progresso["erro"] += 1
            progresso["resultados"].append(res)
            _salvar_progresso(progresso)

            dt_total = time.time() - inicio_global
            eta_s = (dt_total / progresso["concluido"]) * (len(pendentes) - progresso["concluido"])
            eta_h = eta_s / 3600
            status = "OK" if res.get("ok") else f"ERR({res.get('erro','?')[:30]})"
            print(f"[{progresso['concluido']:3d}/{len(pendentes)}] {res['ticker']:8s} {status:25s} "
                  f"docs={res.get('docs',0):4d}  {res.get('duracao_s',0):.0f}s  "
                  f"| total {dt_total/60:.0f}min  ETA {eta_h:.1f}h", flush=True)

    total_dt = time.time() - inicio_global
    print(f"\n[lote] concluído em {total_dt/60:.1f}min  ok={progresso['ok']}  erro={progresso['erro']}")
    return 0 if progresso["erro"] == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
