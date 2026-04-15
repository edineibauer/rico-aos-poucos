#!/bin/bash
# Inicia N workers paralelos de mineração em background (idempotente).
#
# Uso:
#   ./start_minerar.sh         # 4 workers, intervalo 15s entre tickers
#   ./start_minerar.sh 2 30    # 2 workers, intervalo 30s
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

N_WORKERS="${1:-4}"
INTERVAL="${2:-15}"

# Cria pasta de lock
mkdir -p "$(dirname "/tmp/fundosnet-minerar-1.pid")"
mkdir -p "$(cd .. && cd ..; pwd)/data"

# Para workers anteriores se houver
for f in /tmp/fundosnet-minerar*.pid; do
    [ -f "$f" ] || continue
    PID=$(cat "$f" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        echo "==================================================="
        echo "  Minerador JA ESTA RODANDO — workers ativos:"
        for ff in /tmp/fundosnet-minerar*.pid; do
            [ -f "$ff" ] && echo "    $(basename $ff): PID $(cat $ff)"
        done
        echo "  Log:    tail -f /tmp/fundosnet-minerar*.log"
        echo "  Parar:  pkill -f 'loop_minerar.sh'"
        echo "==================================================="
        exit 0
    fi
    rm -f "$f"
done

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

for i in $(seq 1 "$N_WORKERS"); do
    WORKER_ID=$i nohup ./loop_minerar.sh "$INTERVAL" > /dev/null 2>&1 &
    disown
    sleep 1
done

sleep 2

PIDS=""
for f in /tmp/fundosnet-minerar-*.pid; do
    [ -f "$f" ] && PIDS="$PIDS $(cat $f)"
done

echo "==================================================="
echo "  Minerador INICIADO — $N_WORKERS workers paralelos"
echo "  PIDs:   $PIDS"
echo "  Lista:  data/fiis-tickers.json (~540 FIIs)"
echo "  Log:    tail -f /tmp/fundosnet-minerar-*.log"
echo "  Parar:  pkill -f 'loop_minerar.sh'"
echo "==================================================="
