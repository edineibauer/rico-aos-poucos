#!/bin/bash
# Inicia loop de geração de páginas FII em background (idempotente).
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PID_FILE="/tmp/fundosnet-gerar.pid"
INTERVAL="${1:-60}"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        echo "==================================================="
        echo "  Gerador JA ESTA RODANDO — PID $PID"
        echo "  Log:    tail -f /tmp/fundosnet-gerar.log"
        echo "  Parar:  kill $PID"
        echo "==================================================="
        exit 0
    fi
    rm -f "$PID_FILE"
fi

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
nohup ./loop_gerar.sh "$INTERVAL" > /dev/null 2>&1 &
disown
sleep 2

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "==================================================="
    echo "  Gerador INICIADO — PID $PID"
    echo "  Consome dossies de fiis-raw/ e gera JSON+HTML das paginas FII"
    echo "  Usa Opus 4.6 — ~15-25 min por ticker"
    echo "  Log:    tail -f /tmp/fundosnet-gerar.log"
    echo "  Parar:  kill $PID"
    echo "==================================================="
else
    echo "ERRO: falha ao iniciar"
    exit 1
fi
