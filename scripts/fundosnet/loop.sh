#!/bin/bash
# Loop contínuo do pipeline Fundos.NET — modo round-robin por FII.
#
# A cada iteração chama run_fii.py, que pega UM FII (o próximo na rotação),
# avalia, e gera artigo se justificável. Depois git_publish.sh commita+pusha.
#
# Uso:
#   ./loop.sh             # intervalo padrão 300s
#   ./loop.sh 600         # intervalo 600s entre execuções
#
# Para rodar independente do shell:
#   nohup ./loop.sh > /dev/null 2>&1 &
#
# Parar:
#   kill $(cat /tmp/fundosnet-loop.pid)

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

INTERVAL="${1:-300}"
MAX_TENTATIVAS="${2:-10}"

LOG_DIR="/tmp"
LOG="$LOG_DIR/fundosnet-loop.log"
PID_FILE="$LOG_DIR/fundosnet-loop.pid"
ITER_LOG_DIR="$LOG_DIR/fundosnet-iter"
mkdir -p "$ITER_LOG_DIR"

# garante que `claude` (CLI do Claude Code) está no PATH
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo $$ > "$PID_FILE"
echo "[loop] PID=$$ intervalo=${INTERVAL}s max_tentativas=${MAX_TENTATIVAS} (round-robin por FII)" | tee -a "$LOG"
echo "[loop] log: $LOG" | tee -a "$LOG"
echo "[loop] parar com: kill $$" | tee -a "$LOG"

trap 'echo "[loop] sinal recebido, encerrando…" | tee -a "$LOG"; rm -f "$PID_FILE"; exit 0' TERM INT

iter=0
while true; do
  iter=$((iter + 1))
  stamp=$(date +'%Y-%m-%d_%H-%M-%S')
  iter_log="$ITER_LOG_DIR/iter-${stamp}.log"

  echo "" | tee -a "$LOG"
  echo "=================================================================" | tee -a "$LOG"
  echo "[loop] iteração #$iter — $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG"
  echo "=================================================================" | tee -a "$LOG"

  python3 -u run_fii.py --max-tentativas "$MAX_TENTATIVAS" 2>&1 | tee "$iter_log" | tee -a "$LOG"

  rc=${PIPESTATUS[0]}
  echo "[loop] iter #$iter terminou com rc=$rc — publicando…" | tee -a "$LOG"
  ./git_publish.sh 2>&1 | tee -a "$LOG"
  echo "[loop] dormindo ${INTERVAL}s" | tee -a "$LOG"
  sleep "$INTERVAL"
done
