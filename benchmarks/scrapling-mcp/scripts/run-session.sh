#!/usr/bin/env sh
# Run one task in one variant, storing logs under runs/<task>/<variant>-<run>/.
# usage: run-session.sh <taskId> <A|B> <runNumber>
# env: BENCH_MODEL, BENCH_THINKING
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TASK="${1:?usage: run-session.sh <taskId> <A|B> <runNumber>}"
VARIANT="${2:?variant required}"
RUN="${3:?run number required}"
MODEL="${BENCH_MODEL:-opencode-go/deepseek-v4.1-flash}"
THINKING="${BENCH_THINKING:-high}"

OUT="$ROOT/runs/$TASK/$VARIANT-$RUN"
mkdir -p "$OUT/sessions"
PROMPT="$(node "$ROOT/scripts/task-prompt.mjs" "$TASK")"

echo "task=$TASK variant=$VARIANT run=$RUN model=$MODEL thinking=$THINKING"
echo "logs -> $OUT"

cd "$ROOT"
START="$(date +%s)"
set +e
pi --approve -p \
  --session-dir "$OUT/sessions" \
  --model "$MODEL" \
  --thinking "$THINKING" \
  "$PROMPT" > "$OUT/answer.txt" 2> "$OUT/stderr.log"
CODE=$?
set -e
END="$(date +%s)"

printf '%s\n' "{\"task\":\"$TASK\",\"variant\":\"$VARIANT\",\"run\":$RUN,\"model\":\"$MODEL\",\"thinking\":\"$THINKING\",\"exitCode\":$CODE,\"wallSeconds\":$((END-START))}" > "$OUT/run.json"

node "$ROOT/scripts/parse-session.mjs" "$OUT" > "$OUT/metrics.json" || true
echo "answer:"
cat "$OUT/answer.txt"
exit $CODE
