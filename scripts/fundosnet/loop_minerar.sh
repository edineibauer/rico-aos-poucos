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

INTERVAL="${1:-30}"
DIAS="${2:-180}"
MAX_DOCS="${3:-12}"

LOG="/tmp/fundosnet-minerar.log"
PID_FILE="/tmp/fundosnet-minerar.pid"
ROT_FILE="$ROOT/data/fundosnet-rotacao-minerar.json"

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo $$ > "$PID_FILE"
echo "[minerar-loop] PID=$$ intervalo=${INTERVAL}s dias=$DIAS max_docs=$MAX_DOCS" | tee -a "$LOG"
echo "[minerar-loop] parar: kill $$" | tee -a "$LOG"

trap 'echo "[minerar-loop] encerrando…" | tee -a "$LOG"; rm -f "$PID_FILE"; exit 0' TERM INT

# Lê universo + descobre próximo ticker (round-robin)
get_proximo() {
    python3 <<PYEOF
import json, sys
from pathlib import Path
universo = json.loads(Path("$ROOT/data/fundosnet-universo.json").read_text("utf-8"))
tickers = sorted(f["ticker"].upper() for f in universo["fundos"])
rot_file = Path("$ROT_FILE")
ultimo = None
if rot_file.exists():
    try: ultimo = json.loads(rot_file.read_text("utf-8")).get("ultimo")
    except Exception: pass
if ultimo and ultimo in tickers:
    i = tickers.index(ultimo)
    proximo = tickers[(i+1) % len(tickers)]
else:
    proximo = tickers[0]
print(proximo)
PYEOF
}

salva_rot() {
    python3 -c "
import json
from pathlib import Path
Path('$ROT_FILE').write_text(json.dumps({'ultimo': '$1', 'em': '$(date -Iseconds)'}, indent=2))
"
}

iter=0
while true; do
    iter=$((iter + 1))
    ticker=$(get_proximo)

    echo "" | tee -a "$LOG"
    echo "=== [minerar #$iter] $(date '+%H:%M:%S') — $ticker ===" | tee -a "$LOG"

    python3 -u minerar.py --ticker "$ticker" --dias "$DIAS" --max-docs "$MAX_DOCS" 2>&1 | tee -a "$LOG"
    rc=${PIPESTATUS[0]}

    salva_rot "$ticker"
    echo "[minerar-loop] #$iter rc=$rc — dormindo ${INTERVAL}s" | tee -a "$LOG"
    sleep "$INTERVAL"
done
