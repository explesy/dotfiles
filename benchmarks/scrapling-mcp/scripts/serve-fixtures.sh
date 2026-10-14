#!/usr/bin/env sh
# Serve local fixtures at http://127.0.0.1:8787/
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${FIXTURE_PORT:-8787}"
echo "fixtures on http://127.0.0.1:$PORT/ (dir: $ROOT/fixtures)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/fixtures"
