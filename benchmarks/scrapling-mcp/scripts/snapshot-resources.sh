#!/usr/bin/env sh
# Snapshot browser-related processes to estimate browser starts / RSS.
# usage: snapshot-resources.sh <outputFile>
set -eu
OUT="${1:?usage: snapshot-resources.sh <outputFile>}"
{
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  ps -Ao pid,rss,etime,comm 2>/dev/null \
    | grep -Ei 'firefox|chromium|chrome|playwright|camoufox|headless|node' \
    | grep -v grep || true
} > "$OUT"
