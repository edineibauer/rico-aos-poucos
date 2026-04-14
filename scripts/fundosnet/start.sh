#!/bin/bash
# Inicia o pipeline Fundos.NET de forma idempotente.
# Se já houver um loop rodando, apenas reporta o status e sai.
#
# O loop opera em modo round-robin: cada iteração processa UM FII
# (o próximo na rotação) e gera artigo/patch se justificável.
#
# Uso:
#   ./start.sh            # intervalo padrão 300s
#   ./start.sh 600        # intervalo 600s
#   ./start.sh 300 5      # intervalo 300s, até 5 tickers tentados por iter
set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

INTERVAL="${1:-300}"
MAX_TENTATIVAS="${2:-10}"

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

nohup ./loop.sh "$INTERVAL" "$MAX_TENTATIVAS" > /dev/null 2>&1 &
disown
sleep 2

if [ -f "$PID_FILE" ]; then
    NEW_PID=$(cat "$PID_FILE")
    echo "==================================================="
    echo "  Pipeline INICIADO em background (round-robin por FII)"
    echo "  PID:            $NEW_PID"
    echo "  Intervalo:      ${INTERVAL}s entre execucoes"
    echo "  Max tentativas: $MAX_TENTATIVAS tickers por execucao"
    echo "  Log:            tail -f /tmp/fundosnet-loop.log"
    echo "  Rotacao:        data/fundosnet-rotacao.json"
    echo "  Parar:          kill $NEW_PID"
    echo "==================================================="
else
    echo "ERRO: falha ao iniciar (PID file nao criado)"
    exit 1
fi
