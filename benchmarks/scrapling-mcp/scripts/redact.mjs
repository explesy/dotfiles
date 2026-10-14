#!/usr/bin/env node
// Redact common secret shapes from a file (in place). usage: redact.mjs <file>
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: redact.mjs <file>");
  process.exit(2);
}
const patterns = [
  [/-----BEGIN[\s\S]*?PRIVATE KEY-----/g, "-----BEGIN REDACTED KEY-----"],
  [/\b(sk-[A-Za-z0-9_-]{10,})\b/g, "sk-REDACTED"],
  [/\b(gh[pousr]_[A-Za-z0-9]{20,})\b/g, "gh_REDACTED"],
  [/\bAIza[0-9A-Za-z_-]{20,}\b/g, "AIzaREDACTED"],
  [/\b(Bearer) [A-Za-z0-9._~+/=-]{8,}/g, "$1 REDACTED"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "JWT_REDACTED"],
];
let text = readFileSync(file, "utf8");
for (const [re, rep] of patterns) text = text.replace(re, rep);
writeFileSync(file, text);
process.stdout.write("redacted: " + file + "\n");
