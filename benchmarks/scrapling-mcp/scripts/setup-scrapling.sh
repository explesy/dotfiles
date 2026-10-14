#!/usr/bin/env sh
# Install Scrapling pinned for the evaluation. Isolated uv tool env.
# usage: setup-scrapling.sh [--browsers]
set -eu
PIN="${SCRAPLING_PIN:-0.4.15}"
PY="${SCRAPLING_PYTHON:-3.12}"

echo "installing scrapling[ai]==$PIN with python $PY"
uv tool install --force --python "$PY" "scrapling[ai]==$PIN"

if [ "${1:-}" = "--browsers" ]; then
  echo "downloading Scrapling browser engines (this is large and slow)"
  if command -v scrapling >/dev/null 2>&1; then
    scrapling install
  else
    uvx --from "scrapling[ai]==$PIN" scrapling install
  fi
fi

echo "done. verify with: pi --approve mcp list"
