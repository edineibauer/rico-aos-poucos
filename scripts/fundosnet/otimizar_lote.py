"""Orquestrador de otimização em massa.

Processa todos os tickers em data/fiis-raw/ e gera data/fiis-optimized/ em paralelo.
Idempotente (pula tickers já otimizados) e resume após interrupção.

Uso:
  python3 otimizar_lote.py                     # 4 workers, todos os tickers
  python3 otimizar_lote.py --workers 6
  python3 otimizar_lote.py --apenas MXRF11,XPML11
  python3 otimizar_lote.py --refazer           # ignora otimizações anteriores
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

from paths import DATA

FIIS_RAW = DATA / "fiis-raw"
FIIS_OPTIMIZED = DATA / "fiis-optimized"
LOG_DIR = Path("/tmp/otimizar-lote-logs")
RESULT_FILE = DATA / "fundosnet-otimizacao-progresso.json"

SCRIPT = Path(__file__).parent / "otimizar.py"


def ja_otimizado(ticker: str) -> bool:
    p = FIIS_OPTIMIZED / ticker.upper() / "_sumario.json"
    if not p.exists():
        return False
    try:
        s = json.loads(p.read_text(encoding="utf-8"))
        return s.get("docs_processados", 0) > 0
    except Exception:
        return False


def rodar_um(ticker: str) -> dict:
    ticker = ticker.upper()
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / f"{ticker}.log"
    inicio = time.time()
    try:
        with log_path.open("w", encoding="utf-8") as logf:
            logf.write(f"# {ticker} — iniciado {datetime.now().isoformat()}\n")
            logf.flush()
            proc = subprocess.run(
                [sys.executable, "-u", str(SCRIPT), ticker, "--sem-vision"],
                stdout=logf, stderr=subprocess.STDOUT,
                cwd=str(SCRIPT.parent),
                timeout=3600,
            )
        dt = time.time() - inicio
        sumario_path = FIIS_OPTIMIZED / ticker / "_sumario.json"
        docs = 0
        bytes_orig = 0
        bytes_otim = 0
        reducao = 0.0
        imgs_brutas = 0
        imgs_mantidas = 0
        imgs_candidatas = 0
        if sumario_path.exists():
            try:
                s = json.loads(sumario_path.read_text(encoding="utf-8"))
                docs = s.get("docs_processados", 0)
                bytes_orig = s.get("total_bytes_original", 0)
                bytes_otim = s.get("total_bytes_otimizado", 0)
                reducao = s.get("reducao_total_pct", 0.0)
                imgs_brutas = s.get("imagens_brutas", 0)
                imgs_mantidas = s.get("imagens_mantidas", 0)
                # Conta candidatas somando dos metas
                base = FIIS_OPTIMIZED / ticker
                for mp in base.glob("*.meta.json"):
                    if mp.name.startswith("_"):
                        continue
                    try:
                        mm = json.loads(mp.read_text(encoding="utf-8"))
                        imgs_candidatas += mm.get("imagens_candidatas_refinamento", 0)
                    except Exception:
                        pass
            except Exception:
                pass
        return {
            "ticker": ticker, "ok": proc.returncode == 0,
            "docs": docs, "duracao_s": round(dt, 1),
            "bytes_original": bytes_orig, "bytes_otimizado": bytes_otim,
            "reducao_pct": reducao, "imgs_brutas": imgs_brutas,
            "imgs_mantidas": imgs_mantidas, "imgs_candidatas": imgs_candidatas,
            "log": str(log_path),
        }
    except subprocess.TimeoutExpired:
        return {"ticker": ticker, "ok": False, "erro": "timeout_1h",
                "duracao_s": round(time.time() - inicio, 1), "log": str(log_path)}
    except Exception as e:
        return {"ticker": ticker, "ok": False, "erro": str(e)[:200],
                "duracao_s": round(time.time() - inicio, 1), "log": str(log_path)}


def _salvar_progresso(progresso: dict) -> None:
    RESULT_FILE.write_text(json.dumps(progresso, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Otimização em lote de todos os tickers")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--apenas", help="Apenas estes tickers (CSV)")
    ap.add_argument("--refazer", action="store_true")
    args = ap.parse_args()

    # Lista tickers com meta.json (foram minerados)
    todos = sorted(
        d.name for d in FIIS_RAW.iterdir()
        if d.is_dir() and (d / "meta.json").exists()
    )

    if args.apenas:
        alvo = set(t.strip().upper() for t in args.apenas.split(",") if t.strip())
        todos = [t for t in todos if t.upper() in alvo]

    if not args.refazer:
        pendentes = [t for t in todos if not ja_otimizado(t)]
        pulados = len(todos) - len(pendentes)
    else:
        pendentes = todos
        pulados = 0

    print(f"[otim-lote] total={len(todos)} pendentes={len(pendentes)} pulados={pulados} workers={args.workers}")
    if not pendentes:
        print("[ok] nada a fazer.")
        return 0

    inicio_global = time.time()
    progresso = {
        "iniciadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "workers": args.workers,
        "total": len(pendentes),
        "concluido": 0,
        "ok": 0, "erro": 0,
        "bytes_original_total": 0,
        "bytes_otimizado_total": 0,
        "resultados": [],
    }
    _salvar_progresso(progresso)

    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        futuros = {ex.submit(rodar_um, t): t for t in pendentes}
        for fut in as_completed(futuros):
            t = futuros[fut]
            try:
                r = fut.result()
            except Exception as e:
                r = {"ticker": t, "ok": False, "erro": str(e)[:200]}

            progresso["concluido"] += 1
            if r.get("ok"):
                progresso["ok"] += 1
                progresso["bytes_original_total"] += r.get("bytes_original", 0)
                progresso["bytes_otimizado_total"] += r.get("bytes_otimizado", 0)
            else:
                progresso["erro"] += 1
            progresso["resultados"].append(r)
            _salvar_progresso(progresso)

            dt_total = time.time() - inicio_global
            eta_s = (dt_total / progresso["concluido"]) * (len(pendentes) - progresso["concluido"])
            eta_h = eta_s / 3600
            status = "OK" if r.get("ok") else f"ERR({r.get('erro','?')[:25]})"
            print(f"[{progresso['concluido']:3d}/{len(pendentes)}] {r['ticker']:8s} {status:28s} "
                  f"docs={r.get('docs',0):3d}  {r.get('duracao_s',0):.0f}s  "
                  f"{r.get('bytes_original',0)/1e6:.0f}MB→{r.get('bytes_otimizado',0)/1e6:.0f}MB "
                  f"(-{r.get('reducao_pct',0):.0f}%)  cand={r.get('imgs_candidatas',0)}  "
                  f"| total {dt_total/60:.0f}min ETA {eta_h:.1f}h", flush=True)

    dt = time.time() - inicio_global
    bo = progresso["bytes_original_total"]
    bt = progresso["bytes_otimizado_total"]
    pct = 100 * (1 - bt / max(1, bo))
    print(f"\n[otim-lote] concluído em {dt/60:.1f}min  ok={progresso['ok']}  erro={progresso['erro']}")
    print(f"  bruto {bo/1e9:.1f} GB → otimizado {bt/1e9:.2f} GB  ({pct:.1f}% redução)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
