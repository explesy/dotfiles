#!/usr/bin/env sh
# Select A/B MCP variant by writing the project-local .pi/mcp.json.
# usage: select-variant.sh A|B
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="${1:?usage: select-variant.sh A|B}"
case "$V" in
  A|a) SRC="$ROOT/config/mcp.baseline.json" ;;
  B|b) SRC="$ROOT/config/mcp.candidate.json" ;;
  *) echo "unknown variant: $V" >&2; exit 2 ;;
esac
cp "$SRC" "$ROOT/.pi/mcp.json"
echo "variant $V selected -> $ROOT/.pi/mcp.json"
