#!/bin/bash
# Loop de analise — consome fila MySQL e gera pagina + analise para cada ticker.
#
# Diferente de loop_gerar.sh (que roda em todos os pendentes por inexistencia
# de pagina), este consome `tracker fila --proximo` que ja prioriza:
#   - novos_docs (prio 100): fundos analisados que ganharam doc novo
#   - primeira_analise (prio 50): fundos otimizados sem analise
#
# Uso:
#   ./loop_analise.sh           # intervalo 30s, fallback gerar_pagina --pendentes
#   ./loop_analise.sh 60        # intervalo 60s
#
# Parar:
#   kill $(cat /tmp/fundosnet-analise.pid)

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
cd "$DIR"

INTERVAL="${1:-30}"

LOG="/tmp/fundosnet-analise.log"
PID_FILE="/tmp/fundosnet-analise.pid"

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo $$ > "$PID_FILE"
echo "[analise-loop] PID=$$ intervalo=${INTERVAL}s" | tee -a "$LOG"
echo "[analise-loop] parar: kill $$" | tee -a "$LOG"

trap 'echo "[analise-loop] encerrando…" | tee -a "$LOG"; rm -f "$PID_FILE"; exit 0' TERM INT

iter=0
while true; do
    iter=$((iter + 1))
    echo "" | tee -a "$LOG"
    echo "=== [analise #$iter] $(date '+%H:%M:%S') ===" | tee -a "$LOG"

    # Pega proximo da fila MySQL
    ticker=$(cd "$ROOT/scripts" && python3 -m tracker fila --proximo 2>/dev/null || true)

    if [ -z "$ticker" ]; then
        echo "[analise-loop] fila vazia — dormindo ${INTERVAL}s" | tee -a "$LOG"
        sleep "$INTERVAL"
        continue
    fi

    echo "[analise-loop] proximo: $ticker" | tee -a "$LOG"
    inicio=$(date +%s)

    # Gera pagina FII (gerar_pagina_fii.py) — mantem compat com pipeline existente.
    python3 -u gerar_pagina_fii.py --ticker "$ticker" 2>&1 | tee -a "$LOG"
    rc=${PIPESTATUS[0]}
    duracao=$(( $(date +%s) - inicio ))

    if [ "$rc" -eq 0 ]; then
        (cd "$ROOT/scripts" && python3 -m tracker fila --concluir "$ticker") 2>&1 | tee -a "$LOG" || true
        (cd "$ROOT/scripts" && python3 -m tracker evento "$ticker" analise --duracao "$duracao") 2>&1 | tee -a "$LOG" || true
        # Re-sincroniza pra atualizar tem_analise/tem_pagina/data_ultima_analise
        (cd "$ROOT/scripts" && python3 -m tracker sync --ticker "$ticker" --quiet) 2>&1 | tee -a "$LOG" || true
        # Publica
        ./git_publish.sh 2>&1 | tee -a "$LOG"
    else
        (cd "$ROOT/scripts" && python3 -m tracker fila --erro "$ticker" "rc=$rc") 2>&1 | tee -a "$LOG" || true
    fi

    echo "[analise-loop] #$iter $ticker rc=$rc dur=${duracao}s — dormindo ${INTERVAL}s" | tee -a "$LOG"
    sleep "$INTERVAL"
done
