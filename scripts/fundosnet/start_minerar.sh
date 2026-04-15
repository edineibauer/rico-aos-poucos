#!/bin/bash
# Inicia loop de mineração em background (idempotente).
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PID_FILE="/tmp/fundosnet-minerar.pid"
INTERVAL="${1:-30}"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        echo "==================================================="
        echo "  Minerador JA ESTA RODANDO — PID $PID"
        echo "  Log:    tail -f /tmp/fundosnet-minerar.log"
        echo "  Parar:  kill $PID"
        echo "==================================================="
        exit 0
    fi
    rm -f "$PID_FILE"
fi

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
nohup ./loop_minerar.sh "$INTERVAL" > /dev/null 2>&1 &
disown
sleep 2

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "==================================================="
    echo "  Minerador INICIADO — PID $PID"
    echo "  Baixa docs dos FIIs no Fundos.NET em round-robin"
    echo "  Log:    tail -f /tmp/fundosnet-minerar.log"
    echo "  Parar:  kill $PID"
    echo "==================================================="
else
    echo "ERRO: falha ao iniciar"
    exit 1
fi
