#!/bin/bash
# Loop de mineração — baixa docs dos FIIs em sequência, 1 por iteração.
#
# Lê universo, pega próximo ticker, executa minerar.py. Pula quem já
# tem dossiê recente (meta.json atualizado <24h).
#
# Uso:
#   ./loop_minerar.sh                   # intervalo 30s
#   ./loop_minerar.sh 60                # intervalo 60s
#
# Parar:
#   kill $(cat /tmp/fundosnet-minerar.pid)

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
cd "$DIR"

INTERVAL="${1:-15}"
DIAS="${2:-90}"
MAX_DOCS="${3:-6}"
WORKER_ID="${WORKER_ID:-0}"     # passe via env pra rodar múltiplos paralelos

LOG="/tmp/fundosnet-minerar${WORKER_ID:+-$WORKER_ID}.log"
PID_FILE="/tmp/fundosnet-minerar${WORKER_ID:+-$WORKER_ID}.pid"
ROT_FILE="$ROOT/data/fundosnet-rotacao-minerar.json"
ROT_LOCK="$ROOT/data/.rotacao-minerar.lock"

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo $$ > "$PID_FILE"
echo "[minerar-loop] PID=$$ intervalo=${INTERVAL}s dias=$DIAS max_docs=$MAX_DOCS" | tee -a "$LOG"
echo "[minerar-loop] parar: kill $$" | tee -a "$LOG"

trap 'echo "[minerar-loop] encerrando…" | tee -a "$LOG"; rm -f "$PID_FILE"; exit 0' TERM INT

# Lê lista expandida (ou universo) + descobre próximo ticker (round-robin)
# Pula tickers que já foram minerados < 7 dias atrás (data/fiis-raw/{T}/meta.json)
get_proximo() {
    python3 <<PYEOF
import json, sys
from pathlib import Path
from datetime import datetime, timedelta

raw_dir = Path("$ROOT/data/fiis-raw")
exp_path = Path("$ROOT/data/fiis-tickers.json")
uni_path = Path("$ROOT/data/fundosnet-universo.json")

if exp_path.exists():
    tickers = sorted(set(json.loads(exp_path.read_text("utf-8"))["tickers"]))
else:
    tickers = sorted(f["ticker"].upper() for f in json.loads(uni_path.read_text("utf-8"))["fundos"])

rot_file = Path("$ROT_FILE")
ultimo = None
if rot_file.exists():
    try: ultimo = json.loads(rot_file.read_text("utf-8")).get("ultimo")
    except Exception: pass

start = (tickers.index(ultimo) + 1) if (ultimo and ultimo in tickers) else 0

# percorre na ordem, pulando os já minerados recentemente
limite = datetime.now() - timedelta(days=7)
n = len(tickers)
for offset in range(n):
    cand = tickers[(start + offset) % n]
    meta = raw_dir / cand / "meta.json"
    if meta.exists():
        try:
            atualizado = datetime.fromisoformat(json.loads(meta.read_text("utf-8")).get("atualizadoEm",""))
            if atualizado > limite:
                continue
        except Exception:
            pass
    print(cand); sys.exit(0)
print(tickers[start % n])  # fallback
PYEOF
}

# Pega próximo ticker E grava rotação dentro do mesmo lock — evita workers
# paralelos pegarem o mesmo ticker.
pega_e_marca() {
    (
        flock 9
        ticker=$(get_proximo)
        # marca como "em rotação" pra próximo worker pular
        python3 -c "
import json
from pathlib import Path
Path('$ROT_FILE').write_text(json.dumps({'ultimo': '$ticker', 'em': '$(date -Iseconds)'}, indent=2))
" 2>/dev/null
        echo "$ticker"
    ) 9>"$ROT_LOCK"
}

iter=0
while true; do
    iter=$((iter + 1))
    ticker=$(pega_e_marca)

    echo "" | tee -a "$LOG"
    echo "=== [minerar w$WORKER_ID #$iter] $(date '+%H:%M:%S') — $ticker ===" | tee -a "$LOG"

    python3 -u minerar.py --ticker "$ticker" --dias "$DIAS" --max-docs "$MAX_DOCS" 2>&1 | tee -a "$LOG"
    rc=${PIPESTATUS[0]}

    echo "[minerar-loop w$WORKER_ID] #$iter rc=$rc — dormindo ${INTERVAL}s" | tee -a "$LOG"
    sleep "$INTERVAL"
done
