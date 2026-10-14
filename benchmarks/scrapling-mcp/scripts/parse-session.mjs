#!/usr/bin/env node
// Parse a Pi session JSONL directory into benchmark metrics JSON.
// usage: parse-session.mjs <runDir>
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (e.endsWith(".jsonl")) acc.push(p);
  }
  return acc;
}

const runDir = process.argv[2];
if (!runDir) {
  console.error("usage: parse-session.mjs <runDir>");
  process.exit(2);
}

const files = walk(join(runDir, "sessions"));
const metrics = {
  sessionFiles: files.length,
  records: 0,
  assistantTurns: 0,
  userMessages: 0,
  toolCalls: 0,
  toolResults: 0,
  toolErrors: 0,
  toolNames: {},
  tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  cost: 0,
  startedAt: null,
  endedAt: null,
  stopReasons: {},
};

const bump = (obj, key) => {
  obj[key] = (obj[key] || 0) + 1;
};

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    metrics.records++;
    if (rec.timestamp) {
      const ts = typeof rec.timestamp === "number" ? new Date(rec.timestamp).toISOString() : rec.timestamp;
      if (!metrics.startedAt || ts < metrics.startedAt) metrics.startedAt = ts;
      if (!metrics.endedAt || ts > metrics.endedAt) metrics.endedAt = ts;
    }
    if (rec.type !== "message") continue;
    const m = rec.message || {};
    if (m.role === "assistant") {
      metrics.assistantTurns++;
      if (m.usage) {
        for (const k of ["input", "output", "cacheRead", "cacheWrite", "totalTokens"]) {
          const key = k === "totalTokens" ? "total" : k;
          metrics.tokens[key] += m.usage[k] || 0;
        }
        metrics.cost += (m.usage.cost && m.usage.cost.total) || 0;
      }
      if (m.stopReason) bump(metrics.stopReasons, m.stopReason);
      for (const part of Array.isArray(m.content) ? m.content : []) {
        if (part && part.type === "toolCall") {
          metrics.toolCalls++;
          bump(metrics.toolNames, part.name || "unknown");
        }
      }
    } else if (m.role === "toolResult") {
      metrics.toolResults++;
      if (m.isError) metrics.toolErrors++;
    } else if (m.role === "user") {
      metrics.userMessages++;
    }
  }
}

if (metrics.startedAt && metrics.endedAt) {
  metrics.sessionSeconds = Math.round(
    (new Date(metrics.endedAt).getTime() - new Date(metrics.startedAt).getTime()) / 1000,
  );
}

process.stdout.write(JSON.stringify(metrics, null, 2) + "\n");
