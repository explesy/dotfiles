#!/usr/bin/env node
// Aggregate runs/*/*/metrics.json + score.json into a table.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runsDir = join(root, "runs");

function listRuns() {
  if (!existsSync(runsDir)) return [];
  const out = [];
  for (const task of readdirSync(runsDir)) {
    const td = join(runsDir, task);
    if (!statSync(td).isDirectory()) continue;
    for (const run of readdirSync(td)) {
      const rd = join(td, run);
      if (!statSync(rd).isDirectory()) continue;
      out.push({ task, run, dir: rd });
    }
  }
  return out.sort((a, b) => (a.task + a.run).localeCompare(b.task + b.run));
}

const readJSON = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);

const rows = listRuns().map(({ task, run, dir }) => {
  const m = readJSON(join(dir, "metrics.json")) || {};
  const r = readJSON(join(dir, "run.json")) || {};
  const s = readJSON(join(dir, "score.json")) || {};
  return { task, run, variant: r.variant ?? "?", score: s.score ?? "", toolCalls: m.toolCalls ?? "", tokens: m.tokens?.total ?? "", wall: r.wallSeconds ?? m.sessionSeconds ?? "", errors: m.toolErrors ?? "" };
});

const header = ["task", "run", "var", "score", "tools", "tokens", "wall", "errors"];
const widths = header.map((h) => Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length), 3));
const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join("  ");
console.log(line(header));
console.log(widths.map((w) => "-".repeat(w)).join("  "));
for (const r of rows) console.log(line(header.map((h) => r[h] ?? "")));

if (!rows.length) console.log("(no runs yet)");
