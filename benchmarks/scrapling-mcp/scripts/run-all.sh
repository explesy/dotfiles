#!/usr/bin/env sh
# Run the full A/B matrix (12 tasks x 2 variants) sequentially.
# usage: run-all.sh
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${FIXTURE_PORT:-8787}"

SRV=""
cleanup() { [ -n "$SRV" ] && kill "$SRV" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

if ! curl -s --noproxy '*' -o /dev/null "http://127.0.0.1:$PORT/index.json"; then
  echo "starting fixture server on :$PORT"
  ./scripts/serve-fixtures.sh > /tmp/scrapling-fixtures.log 2>&1 &
  SRV=$!
  sleep 2
fi

TASKS="T01 T02 T03 T04 T05 T06 T07 T08 T09 T10 T11 T12"
for V in A B; do
  ./scripts/select-variant.sh "$V" >/dev/null
  for T in $TASKS; do
    printf '\n===== %s / variant %s =====\n' "$T" "$V"
    if ./scripts/run-session.sh "$T" "$V" 1; then
      echo "OK $T $V"
    else
      echo "FAILED $T $V (continuing)"
    fi
  done
done

./scripts/select-variant.sh A >/dev/null
echo "\nALL DONE"
