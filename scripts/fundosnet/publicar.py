"""Deploy end-to-end após análises de FIIs.

Pipeline:
  1. Consolida data/fiis.json (listagem)
  2. Atualiza sitemap.xml (FIIs + lastmod)
  3. Bump APP_VERSION em sw.js (força update do PWA)
  4. git add + commit
  5. git push origin master
  6. Deploy no Cloudflare Pages via wrangler

Uso:
  python3 publicar.py                        # pipeline completo
  python3 publicar.py --mensagem "texto..."  # mensagem de commit customizada
  python3 publicar.py --sem-deploy           # só git, sem Cloudflare
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from paths import ROOT

SCRIPTS_DIR = Path(__file__).parent
SW_PATH = ROOT / "sw.js"


def run(cmd: list[str], cwd: Path | None = None, timeout: int = 300) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, cwd=str(cwd) if cwd else None,
                              capture_output=True, text=True, timeout=timeout)
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return 124, "", f"timeout {timeout}s"


def bump_sw_version() -> str | None:
    """Incrementa APP_VERSION de '4.13' → '4.14'."""
    if not SW_PATH.exists():
        return None
    texto = SW_PATH.read_text(encoding="utf-8")
    m = re.search(r"const APP_VERSION = '([\d.]+)';", texto)
    if not m:
        return None
    atual = m.group(1)
    partes = atual.split(".")
    partes[-1] = str(int(partes[-1]) + 1)
    nova = ".".join(partes)
    novo_texto = texto.replace(f"const APP_VERSION = '{atual}';",
                               f"const APP_VERSION = '{nova}';", 1)
    SW_PATH.write_text(novo_texto, encoding="utf-8")
    return f"{atual} → {nova}"


def git_tem_mudancas() -> bool:
    rc, out, _ = run(["git", "status", "--short"], cwd=ROOT)
    return bool(out.strip())


def git_commit_push(mensagem: str) -> bool:
    # Add: só arquivos de conteúdo do site (não data/fiis-raw/optimized/etc já no .gitignore)
    run(["git", "add", ".gitignore", "sw.js", "css", "js",
         "data/fiis.json", "data/fiis/", "fiis/", "sitemap.xml",
         "scripts/fundosnet/", "data/fundosnet-liquidos.json"], cwd=ROOT)
    rc_status, out, _ = run(["git", "status", "--short"], cwd=ROOT)
    if not out.strip():
        print("[publicar] nada a commitar.")
        return False

    n_arquivos = len([l for l in out.strip().splitlines() if l.startswith(("A ", "M ", "D "))])
    print(f"[publicar] {n_arquivos} arquivos staged. Criando commit...")

    rc, out, err = run(["git", "commit", "-m", mensagem], cwd=ROOT, timeout=120)
    if rc != 0:
        print(f"[erro] git commit: {err[:500]}")
        return False
    print(out.strip()[-400:])

    print("[publicar] push origin master…")
    rc, out, err = run(["git", "push", "origin", "master"], cwd=ROOT, timeout=180)
    if rc != 0:
        print(f"[erro] git push: {err[:500]}")
        return False
    print((out + err).strip()[-300:])
    return True


def deploy_cloudflare() -> bool:
    tmp = Path("/tmp/rico-deploy")
    run(["rm", "-rf", str(tmp)])
    tmp.mkdir(parents=True, exist_ok=True)

    print("[publicar] empacotando deploy (git archive)…")
    rc, _, err = run(["bash", "-c", f"cd {ROOT} && git archive master | tar -x -C {tmp}/"], timeout=120)
    if rc != 0:
        print(f"[erro] git archive: {err[:300]}")
        return False

    print("[publicar] wrangler pages deploy…")
    rc, out, err = run(
        ["wrangler", "pages", "deploy", str(tmp),
         "--project-name", "rico-aos-poucos",
         "--branch", "master",
         "--commit-dirty=true"],
        cwd=ROOT,
        timeout=600,
    )
    combined = out + err
    print(combined.strip()[-800:])
    run(["rm", "-rf", str(tmp)])
    return rc == 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mensagem", help="Mensagem de commit (sobrescreve default)")
    ap.add_argument("--sem-deploy", action="store_true", help="Só git, sem Cloudflare")
    ap.add_argument("--apenas-deploy", action="store_true",
                    help="Pula git, faz só re-deploy do estado atual")
    args = ap.parse_args()

    inicio = time.time()

    if not args.apenas_deploy:
        # 1. Consolida data/fiis.json
        print("\n[1/4] consolidar_fiis_json")
        rc, out, err = run([sys.executable, str(SCRIPTS_DIR / "consolidar_fiis_json.py")],
                           cwd=ROOT, timeout=60)
        print((out + err).strip()[-500:])

        # 2. Atualiza sitemap
        print("\n[2/4] atualizar_sitemap")
        rc, out, err = run([sys.executable, str(SCRIPTS_DIR / "atualizar_sitemap.py")],
                           cwd=ROOT, timeout=60)
        print((out + err).strip()[-500:])

        # 3. Bump SW
        print("\n[3/4] bump sw.js")
        bump_info = bump_sw_version()
        print(f"  APP_VERSION: {bump_info or '(sem alteração)'}")

        # 4. Git commit + push
        print("\n[4/4] git commit + push")
        if not git_tem_mudancas():
            print("  nada a commitar, pulando.")
        else:
            msg = args.mensagem or (
                "auto: análises FIIs + sitemap + consolidado\n\n"
                "Gerado por scripts/fundosnet/publicar.py\n\n"
                "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
            )
            if not git_commit_push(msg):
                print("[erro] git falhou — abortando deploy")
                return 1

    # 5. Deploy Cloudflare Pages
    if not args.sem_deploy:
        print("\n[deploy] Cloudflare Pages")
        if not deploy_cloudflare():
            print("[erro] deploy Cloudflare falhou")
            return 1

    dt = time.time() - inicio
    print(f"\n[publicar] ✅ concluído em {dt:.0f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
