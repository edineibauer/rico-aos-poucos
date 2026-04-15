#!/bin/bash
# Loop de geração de páginas FII — consome dossiês de fiis-raw/ e
# gera JSON + HTML da página. Usa Opus 4.6. 1 ticker por iteração.
#
# Uso:
#   ./loop_gerar.sh            # intervalo 60s
#   ./loop_gerar.sh 120        # intervalo 120s
#
# Parar:
#   kill $(cat /tmp/fundosnet-gerar.pid)

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
cd "$DIR"

INTERVAL="${1:-30}"

LOG="/tmp/fundosnet-gerar.log"
PID_FILE="/tmp/fundosnet-gerar.pid"

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo $$ > "$PID_FILE"
echo "[gerar-loop] PID=$$ intervalo=${INTERVAL}s" | tee -a "$LOG"
echo "[gerar-loop] parar: kill $$" | tee -a "$LOG"

trap 'echo "[gerar-loop] encerrando…" | tee -a "$LOG"; rm -f "$PID_FILE"; exit 0' TERM INT

iter=0
while true; do
    iter=$((iter + 1))
    echo "" | tee -a "$LOG"
    echo "=== [gerar #$iter] $(date '+%H:%M:%S') ===" | tee -a "$LOG"

    # --pendentes processa só os que têm dossiê mas página vazia/inexistente.
    # O gerador processa UM em sequência e sai — próxima iteração pega o próximo.
    python3 -u gerar_pagina_fii.py --pendentes --limit 1 2>&1 | tee -a "$LOG"
    rc=${PIPESTATUS[0]}

    # Publica no git se houver mudanças
    ./git_publish.sh 2>&1 | tee -a "$LOG"

    echo "[gerar-loop] #$iter rc=$rc — dormindo ${INTERVAL}s" | tee -a "$LOG"
    sleep "$INTERVAL"
done
