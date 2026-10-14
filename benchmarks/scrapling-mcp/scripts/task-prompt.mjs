#!/usr/bin/env node
// Print the fixed prompt for a task id.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2];
if (!id) {
  console.error("usage: task-prompt.mjs <taskId>");
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(join(here, "..", "fixtures", "index.json"), "utf8"));
const task = manifest.tasks.find((t) => t.id === id);
if (!task) {
  console.error("unknown task: " + id);
  process.exit(2);
}
process.stdout.write(task.prompt);
