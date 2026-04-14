#!/bin/bash
# Comita e pusha mudanças do pipeline pro GitHub (dispara deploy Cloudflare).
# Chamado ao fim de cada iteração do loop.sh. Idempotente: se não há diffs, sai silenciosamente.
set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
cd "$ROOT"

# Paths que o pipeline modifica (nunca fora daqui)
PATHS=(
    "data/fiis"
    "data/artigos.json"
    "artigos"
    "sitemap.xml"
    "sw.js"
)

# Há mudanças?
CHANGES=$(git status --porcelain "${PATHS[@]}" 2>/dev/null)
if [ -z "$CHANGES" ]; then
    exit 0
fi

# Descobre quais tickers mudaram (pra mensagem de commit)
TICKERS=$(git status --porcelain data/fiis/*.json 2>/dev/null \
    | awk '{print $NF}' \
    | xargs -n1 basename 2>/dev/null \
    | sed 's/\.json$//' \
    | tr '[:lower:]' '[:upper:]' \
    | sort -u \
    | tr '\n' ',' \
    | sed 's/,$//')

# Descobre quantos artigos novos
ARTIGOS=$(git status --porcelain artigos/*.html 2>/dev/null | grep -c "^??\|^A " || true)

# Monta mensagem
STAMP=$(date '+%Y-%m-%d %H:%M')
if [ -n "$TICKERS" ] && [ "$ARTIGOS" -gt 0 ]; then
    MSG="auto: pipeline Fundos.NET — $TICKERS + $ARTIGOS artigo(s) ($STAMP)"
elif [ -n "$TICKERS" ]; then
    MSG="auto: pipeline Fundos.NET — $TICKERS ($STAMP)"
elif [ "$ARTIGOS" -gt 0 ]; then
    MSG="auto: pipeline Fundos.NET — $ARTIGOS artigo(s) ($STAMP)"
else
    MSG="auto: pipeline Fundos.NET — $STAMP"
fi

# Commit + push
git add "${PATHS[@]}" 2>/dev/null
git commit -m "$MSG" 2>&1 || exit 0
git push origin master 2>&1
