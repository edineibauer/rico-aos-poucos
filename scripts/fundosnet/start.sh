#!/bin/bash
# Inicia o pipeline Fundos.NET de forma idempotente.
# Se já houver um loop rodando, apenas reporta o status e sai.
#
# Uso:
#   ./start.sh                                  # MFII11,BTAL11 — padrão
#   ./start.sh "MFII11,BTAL11,HGLG11"           # tickers customizados
#   ./start.sh "MFII11,BTAL11" 300 720          # intervalo, lookback
set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

TICKERS="${1:-MFII11,BTAL11}"
INTERVAL="${2:-300}"
LOOKBACK="${3:-720}"

PID_FILE="/tmp/fundosnet-loop.pid"
LOCK_FILE="/tmp/fundosnet.lock"

# Verifica se já está rodando
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        CMD=$(ps -o args= -p "$PID" 2>/dev/null | head -1)
        echo "==================================================="
        echo "  Pipeline JA ESTA RODANDO"
        echo "  PID:     $PID"
        echo "  Comando: $CMD"
        echo "  Log:     tail -f /tmp/fundosnet-loop.log"
        echo "  Parar:   kill $PID"
        echo "==================================================="
        exit 0
    fi
    rm -f "$PID_FILE"
fi

# PID morto ou ausente - limpa estado e inicia
rm -f "$LOCK_FILE"
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

nohup ./loop.sh "$TICKERS" "$INTERVAL" "$LOOKBACK" > /dev/null 2>&1 &
disown
sleep 2

if [ -f "$PID_FILE" ]; then
    NEW_PID=$(cat "$PID_FILE")
    echo "==================================================="
    echo "  Pipeline INICIADO em background"
    echo "  PID:       $NEW_PID"
    echo "  Tickers:   $TICKERS"
    echo "  Intervalo: ${INTERVAL}s"
    echo "  Lookback:  ${LOOKBACK}h (reduz para 48h apos 1a iter)"
    echo "  Log:       tail -f /tmp/fundosnet-loop.log"
    echo "  Parar:     kill $NEW_PID"
    echo "==================================================="
else
    echo "ERRO: falha ao iniciar (PID file nao criado)"
    exit 1
fi
