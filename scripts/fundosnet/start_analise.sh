#!/bin/bash
# Inicia o loop de analise (consome fii_fila do MySQL) em background, idempotente.
#
# Uso:
#   ./start_analise.sh           # intervalo 30s
#   ./start_analise.sh 60        # intervalo 60s
set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

INTERVAL="${1:-30}"
PID_FILE="/tmp/fundosnet-analise.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        echo "==================================================="
        echo "  Analise JA ESTA RODANDO — PID=$PID"
        echo "  Log:    tail -f /tmp/fundosnet-analise.log"
        echo "  Parar:  kill $PID"
        echo "==================================================="
        exit 0
    fi
    rm -f "$PID_FILE"
fi

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

nohup ./loop_analise.sh "$INTERVAL" > /dev/null 2>&1 &
disown
sleep 2

if [ -f "$PID_FILE" ]; then
    NEW_PID=$(cat "$PID_FILE")
    echo "==================================================="
    echo "  Analise INICIADA — consumindo fii_fila"
    echo "  PID:        $NEW_PID"
    echo "  Intervalo:  ${INTERVAL}s"
    echo "  Log:        tail -f /tmp/fundosnet-analise.log"
    echo "  Estado:     python3 -m tracker fila"
    echo "  Parar:      kill $NEW_PID"
    echo "==================================================="
else
    echo "ERRO: falha ao iniciar"
    exit 1
fi
