#!/bin/bash
# Loop contínuo do pipeline Fundos.NET.
#
# Uso:
#   ./loop.sh                                 # tickers padrão (MFII11,KFOF11,KISU11,BTAL11)
#   ./loop.sh "BLMG11,HGLG11"                 # tickers customizados
#   ./loop.sh "" 300                          # todos, intervalo 300s
#
# Para rodar independente do shell do Claude Code, use:
#   nohup ./loop.sh > /dev/null 2>&1 &
#   setsid -f ./loop.sh                       # alternativa
#
# Parar:
#   kill $(cat /tmp/fundosnet-loop.pid)

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

TICKERS="${1:-MFII11,KFOF11,KISU11,BTAL11}"
INTERVAL="${2:-300}"
LOOKBACK_HORAS="${3:-720}"   # primeira iteração: 30 dias; depois seen.json faz dedupe

LOG_DIR="/tmp"
LOG="$LOG_DIR/fundosnet-loop.log"
PID_FILE="$LOG_DIR/fundosnet-loop.pid"
ITER_LOG_DIR="$LOG_DIR/fundosnet-iter"
mkdir -p "$ITER_LOG_DIR"

# garante que `claude` (CLI do Claude Code) está no PATH
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo $$ > "$PID_FILE"
echo "[loop] PID=$$ tickers=$TICKERS intervalo=${INTERVAL}s lookback=${LOOKBACK_HORAS}h" | tee -a "$LOG"
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

  if [ -n "$TICKERS" ]; then
    python3 -u run.py --ticker "$TICKERS" --lookback "$LOOKBACK_HORAS" 2>&1 | tee "$iter_log" | tee -a "$LOG"
  else
    python3 -u run.py --lookback "$LOOKBACK_HORAS" 2>&1 | tee "$iter_log" | tee -a "$LOG"
  fi

  rc=${PIPESTATUS[0]}
  echo "[loop] iter #$iter terminou com rc=$rc — publicando…" | tee -a "$LOG"
  ./git_publish.sh 2>&1 | tee -a "$LOG"
  echo "[loop] dormindo ${INTERVAL}s" | tee -a "$LOG"
  # Após 1ª iteração, reduz lookback para só últimas 48h (seen.json ignora já vistos)
  if [ "$iter" -eq 1 ]; then
    LOOKBACK_HORAS=48
  fi
  sleep "$INTERVAL"
done
