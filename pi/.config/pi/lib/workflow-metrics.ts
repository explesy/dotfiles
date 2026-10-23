import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const phases = new Set(["selecting", "selected", "investigating", "planning", "implementing", "testing", "reviewing", "fixing", "finishing", "blocked"]);
const tools = new Set(["read", "write", "edit", "bash", "grep", "find", "ls", "subagent", "workflow_status"]);
const qualities = new Set(["unverified", "accepted", "needs-fixes"]);
const reasons = new Set(["contract", "tests", "scope", "evidence", "other"]);
const validId = (id: string) => /^\d{13}-[a-f0-9-]{36}$/.test(id);
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
const label = (value: unknown) => typeof value === "string" && /^[\w.:/+\-]{1,160}$/.test(value) ? value : "unknown";

export const metricsDirectory = () => process.env.PI_WORKFLOW_METRICS_DIR || join(process.env.XDG_STATE_HOME || join(homedir(), ".local/state"), "pi/workflow-metrics");

type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number; estimatedCost: number; missingCost: number };
const emptyUsage = (): Usage => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, estimatedCost: 0, missingCost: 0 });
function addUsage(target: Usage, value: any) {
  for (const key of ["input", "output", "cacheRead", "cacheWrite"] as const) target[key] += number(value?.[key]) ?? 0;
  const cost = number(typeof value?.cost === "number" ? value.cost : value?.cost?.total);
  if (cost === null) target.missingCost++;
  else target.estimatedCost += cost;
}

/** Classification only: never retain commands, output, prompts or file paths.
 * Recognizes a plain check invocation and a few fixed display wrappers. Other
 * compound shells, pipes and quoted strings are not treated as check evidence. */
function classifyCheck(command: unknown): { family: string; single: boolean } | undefined {
  if (typeof command !== "string") return;
  let text = command.trim();
  // Common display wrappers still expose the first check invocation, but the
  // shell's exit code belongs to the wrapper, not to that individual check.
  text = text.replace(/;\s*echo\s+"(?:[A-Z_]{1,32}=)?\$\?"\s*$/, "");
  text = text.replace(/\s+\|\s*tail\s+(?:-\d+|-n\s+\d+)\s*$/, "");
  text = text.replace(/\s+2>&1\s*$/, "");
  if (/[\n\r;&|`$<>"'\\()]/.test(text)) return;
  const words = text.trim().split(/\s+/);
  const result = (family: string) => ({ family, single: text === command.trim() });
  if (["npm", "pnpm", "yarn"].includes(words[0])) {
    const task = words[1] === "run" ? words[2] : words[1];
    if (task === "build" || task === "lint") return result(task);
    if (task === "test" || task?.startsWith("test:")) return result("tests");
    if (task === "exec") {
      words.splice(0, 2);
      if (words[0] === "--") words.shift();
    }
  } else if (words[0] === "npx") words.shift();
  if (words[0] === "vitest" && words[1] === "run") return result("tests");
  if (words[0] === "node" && words[1] === "--test") return result("tests");
  if (words[0] === "pytest" || words[0] === "cargo" && words[1] === "test" || words[0] === "go" && words[1] === "test") return result("tests");
}
export const checkFamily = (command: unknown) => classifyCheck(command)?.family;

async function atomicJson(file: string, value: unknown) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: "wx" });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

type CheckCounts = { invocations: number; toolSuccess: number; toolError: number; exitZero: number; exitNonzero: number; exitUnknown: number; noResult: number };
const emptyChecks = (): CheckCounts => ({ invocations: 0, toolSuccess: 0, toolError: 0, exitZero: 0, exitNonzero: 0, exitUnknown: 0, noResult: 0 });
type MetricsOptions = { directory?: string; enabled?: boolean; revision: string; now?: () => number; monotonic?: () => number; onError?: () => void };

export class WorkflowMetrics {
  private options: MetricsOptions;
  private active: any;
  private pending = new Map<string, { family: string; single: boolean } | undefined>();
  private children = new Set<string>();
  private childSerial = 0;
  private started = 0;
  private pauseStarted: number | undefined;
  private paused = 0;
  private lastStop = "";
  private phase = "";
  private warned = false;
  private queue: Promise<void> = Promise.resolve();

  constructor(options: MetricsOptions) { this.options = options; }
  private clock() { return (this.options.monotonic ?? (() => performance.now()))(); }
  private safelyError() {
    if (this.warned) return;
    this.warned = true;
    try { this.options.onError?.(); } catch { /* Metrics must never break the task. */ }
  }
  private persist(run: any) {
    // Snapshot before enqueueing: a live run must not mutate its checkpoint.
    const snapshot = JSON.parse(JSON.stringify(run));
    const directory = this.options.directory ?? metricsDirectory();
    this.queue = this.queue.then(async () => {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await atomicJson(join(directory, `${snapshot.id}.run.json`), snapshot);
      await writeReport(directory);
    }).catch(() => this.safelyError());
  }

  start(info: { cwd: string; sessionId?: string; kind: "task" | "context" | "issue" | "queue"; provider: string; model: string; thinking: string }) {
    if (this.options.enabled === false || process.env.PI_WORKFLOW_METRICS === "0") return;
    this.finish("superseded");
    const now = (this.options.now ?? Date.now)();
    this.active = {
      schemaVersion: 1, id: `${now}-${randomUUID()}`, startedAt: new Date(now).toISOString(),
      workflowRevision: label(this.options.revision), kind: info.kind,
      project: createHash("sha256").update(info.cwd).digest("hex").slice(0, 16),
      session: info.sessionId ? createHash("sha256").update(info.sessionId).digest("hex").slice(0, 16) : null,
      route: { provider: label(info.provider), model: label(info.model), thinking: label(info.thinking) },
      parentUsage: emptyUsage(), helperUsage: emptyUsage(), helpersObserved: 0,
      toolCalls: {}, toolErrors: 0, phases: {}, checks: { tests: emptyChecks(), build: emptyChecks(), lint: emptyChecks() },
      assistantMessages: 0, modelErrors: 0, routingChanges: 0, quality: "unverified",
      execution: "started", endedAt: null, wallMs: null, uiWaitMs: 0, nonUiWallMs: null,
    };
    this.started = this.clock(); this.paused = 0; this.pauseStarted = undefined;
    this.lastStop = ""; this.phase = ""; this.pending.clear(); this.children.clear(); this.childSerial = 0;
    this.persist(this.active);
  }

  recordPhase(value: string) {
    if (!this.active || !phases.has(value)) return;
    this.phase = value;
    this.active.phases[value] = (this.active.phases[value] ?? 0) + 1;
  }
  pause() { if (this.active && this.pauseStarted === undefined) this.pauseStarted = this.clock(); }
  resume() {
    if (this.pauseStarted === undefined) return;
    this.paused += Math.max(0, this.clock() - this.pauseStarted); this.pauseStarted = undefined;
  }
  routingChanged() { if (this.active) this.active.routingChanges++; }
  toolStart(event: any) {
    if (!this.active) return;
    const name = tools.has(event.toolName) ? event.toolName : "other";
    this.active.toolCalls[name] = (this.active.toolCalls[name] ?? 0) + 1;
    // Retain only call IDs and the fixed check category until the result arrives.
    const check = event.toolName === "bash" ? classifyCheck(event.args?.command) : undefined;
    if (check) this.active.checks[check.family].invocations++;
    this.pending.set(event.toolCallId, check);
  }
  toolEnd(event: any) {
    if (!this.active || !this.pending.has(event.toolCallId)) return;
    if (event.isError) this.active.toolErrors++;
    const classification = this.pending.get(event.toolCallId); this.pending.delete(event.toolCallId);
    if (classification) {
      const check = this.active.checks[classification.family];
      check[event.isError ? "toolError" : "toolSuccess"]++;
      // Do not infer individual check exit codes from shell success or log text.
      const code = classification.single ? event.result?.details?.exitCode : undefined;
      if (!Number.isInteger(code)) check.exitUnknown++;
      else if (code === 0) check.exitZero++;
      else check.exitNonzero++;
    }
    if (event.toolName === "subagent") {
      const details = event.result?.details;
      for (const child of Array.isArray(details?.results) ? details.results : []) {
        const key = details.runId && Number.isInteger(child.index) ? `${details.runId}:${child.index}` : `observed:${this.childSerial++}`;
        if (this.children.has(key)) continue;
        this.children.add(key); this.active.helpersObserved++;
        addUsage(this.active.helperUsage, child.usage);
      }
    }
  }
  messageEnd(message: any) {
    if (!this.active || message?.role !== "assistant") return;
    this.active.assistantMessages++; addUsage(this.active.parentUsage, message.usage);
    this.lastStop = message.stopReason;
    if (message.stopReason === "error") this.active.modelErrors++;
  }
  finish(reason?: "superseded" | "interrupted") {
    if (!this.active) return;
    this.resume();
    for (const check of this.pending.values()) if (check) {
      this.active.checks[check.family].noResult++; this.active.checks[check.family].exitUnknown++;
    }
    const run = this.active; this.active = undefined; this.pending.clear(); this.children.clear();
    run.endedAt = new Date((this.options.now ?? Date.now)()).toISOString();
    run.wallMs = Math.max(0, this.clock() - this.started); run.uiWaitMs = this.paused;
    run.nonUiWallMs = Math.max(0, run.wallMs - run.uiWaitMs);
    run.execution = reason ?? (this.lastStop === "aborted" ? "aborted" : this.lastStop === "error" ? "model-error" : this.phase === "blocked" ? "blocked" : "settled");
    this.persist(run);
  }
  async flush() { await this.queue; }
}

export async function readRuns(directory: string, limit = 200) {
  let files: string[];
  try { files = await readdir(directory); } catch (error: any) { if (error.code === "ENOENT") return { runs: [], unreadable: 0 }; throw error; }
  const selected = files.filter(file => file.endsWith(".run.json") && validId(file.slice(0, -9))).sort().reverse().slice(0, limit);
  const runs: any[] = []; let unreadable = 0;
  for (const file of selected) {
    try {
      const run = JSON.parse(await readFile(join(directory, file), "utf8"));
      if (run.schemaVersion !== 1 || run.id !== file.slice(0, -9) ||
        !(number(run.wallMs) !== null || run.execution === "started" && run.wallMs === null) ||
        !run.route || ![run.parentUsage, run.helperUsage].every(usage => usage && Object.keys(emptyUsage()).every(key => number(usage[key]) !== null)) ||
        !["tests", "build", "lint"].every(key => run.checks?.[key] && Object.keys(emptyChecks()).every(field => number(run.checks[key][field]) !== null)) ||
        number(run.helpersObserved) === null || number(run.routingChanges) === null) throw new Error("Invalid record");
      run.quality = "unverified";
      try {
        const feedback = JSON.parse(await readFile(join(directory, `${run.id}.feedback.json`), "utf8"));
        if (feedback.id === run.id && qualities.has(feedback.quality)) { run.quality = feedback.quality; run.feedbackReason = reasons.has(feedback.reason) ? feedback.reason : null; }
      } catch (error: any) { if (error.code !== "ENOENT") unreadable++; }
      runs.push(run);
    } catch { unreadable++; }
  }
  return { runs, unreadable };
}

export function summarize(runs: any[], unreadable = 0) {
  const groups = new Map<string, any>();
  const quality = { unverified: 0, accepted: 0, "needs-fixes": 0 };
  const checkTotals = { tests: emptyChecks(), build: emptyChecks(), lint: emptyChecks() };
  let repeatedTests = 0; let unknownExits = 0; let unfinished = 0;
  for (const run of runs) {
    quality[qualities.has(run.quality) ? run.quality as keyof typeof quality : "unverified"]++;
    if (run.checks.tests.invocations > 1) repeatedTests++;
    unknownExits += Object.values(run.checks).reduce((sum: number, value: any) => sum + (number(value.exitUnknown) ?? 0), 0);
    for (const key of ["tests", "build", "lint"] as const) for (const field of Object.keys(emptyChecks()) as (keyof CheckCounts)[]) checkTotals[key][field] += run.checks[key][field];
    if (run.execution === "started") { unfinished++; continue; }
    const key = [label(run.workflowRevision), label(run.route.provider), label(run.route.model), label(run.route.thinking)].join("/");
    let group = groups.get(key);
    if (!group) { group = { revision: label(run.workflowRevision), provider: label(run.route.provider), model: label(run.route.model), thinking: label(run.route.thinking), runs: 0, wallMs: [], nonUiWallMs: [], estimatedCost: 0, missingCost: 0, helpersObserved: 0, mixedRouting: 0, observedTokens: 0 }; groups.set(key, group); }
    group.runs++; group.wallMs.push(run.wallMs);
    group.nonUiWallMs.push(number(run.nonUiWallMs) ?? run.wallMs);
    group.estimatedCost += run.parentUsage.estimatedCost + run.helperUsage.estimatedCost;
    group.missingCost += run.parentUsage.missingCost + run.helperUsage.missingCost;
    group.helpersObserved += run.helpersObserved;
    if (run.routingChanges > 0) group.mixedRouting++;
    for (const usage of [run.parentUsage, run.helperUsage]) for (const key of ["input", "output", "cacheRead", "cacheWrite"]) group.observedTokens += usage[key];
  }
  return {
    schemaVersion: 1, generatedAt: new Date().toISOString(), window: "latest 200 run records; no automatic deletion", runs: runs.length, unreadable, unfinished, quality, repeatedTests, unknownExits, checkTotals,
    groups: [...groups.values()].map(group => {
      const median = (times: number[]) => { times.sort((a, b) => a - b); const mid = Math.floor(times.length / 2); return times.length % 2 ? times[mid] : (times[mid - 1] + times[mid]) / 2; };
      return { ...group, medianWallMs: median(group.wallMs), medianNonUiWallMs: median(group.nonUiWallMs), wallMs: undefined, nonUiWallMs: undefined };
    }),
    latest: runs.slice(0, 20).map(run => ({ id: run.id, kind: label(run.kind), execution: label(run.execution), quality: run.quality, feedbackReason: run.feedbackReason ?? null })),
  };
}

export function reportMarkdown(summary: ReturnType<typeof summarize>) {
  return `# /i — статистика обычной работы

Обновлено: ${summary.generatedAt}
Последние ${summary.runs} запусков (максимум 200); нечитаемых записей: ${summary.unreadable}.
Без зафиксированного завершения: ${summary.unfinished}. Это может быть работающий процесс или аварийно прерванный запуск; они не входят в медианы и суммы стоимости завершённых запусков.

Качество: принято ${summary.quality.accepted}, потребовало исправлений ${summary.quality["needs-fixes"]}, не проверено ${summary.quality.unverified}.
Завершение запуска и успешный ответ инструмента не подтверждают качество результата.

| Workflow revision | Начальная модель / effort | Запуски | Медиана времени, с | Без ожидания UI, с | Наблюдаемая стоимость, $ | Помощники | Отсутствующие cost | Смены маршрута: запуски |
|---|---|---:|---:|---:|---:|---:|---:|---:|
${summary.groups.map(group => `| ${group.revision} | ${group.provider}/${group.model} / ${group.thinking} | ${group.runs} | ${(group.medianWallMs / 1000).toFixed(1)} | ${(group.medianNonUiWallMs / 1000).toFixed(1)} | ${group.estimatedCost.toFixed(6)} | ${group.helpersObserved} | ${group.missingCost} | ${group.mixedRouting} |`).join("\n")}

Распознанные проверки (категории определены по одиночным shell-командам):

| Категория | Вызовы | Tool success | Tool error | Exit 0 | Exit nonzero | Exit неизвестен | Нет результата |
|---|---:|---:|---:|---:|---:|---:|---:|
${Object.entries(summary.checkTotals).map(([key, value]) => `| ${key} | ${value.invocations} | ${value.toolSuccess} | ${value.toolError} | ${value.exitZero} | ${value.exitNonzero} | ${value.exitUnknown} | ${value.noResult} |`).join("\n")}

Для проверки: ${summary.repeatedTests} запусков с несколькими распознанными тестовыми командами. Причины повторов неизвестны; это не доказательство лишних прогонов.
Неизвестных exit codes распознанных проверок: ${summary.unknownExits}. Произвольные compound-команды и вывод инструментов не анализируются.
Стоимость и токены — только usage сообщений основного агента и результатов помощников; compaction и неотданные usage могут отсутствовать. Session totals повторно не прибавляются. Суммы токенов доступны в summary.json.
Разные задачи, смены модели и ожидание пользователя мешают прямому сравнению. Метрики не меняют правила и модели автоматически.

Последние записи:

${summary.latest.map(run => `- ${run.id}: ${run.kind}, ${run.execution}, ${run.quality}${run.feedbackReason ? ` (${run.feedbackReason})` : ""}`).join("\n")}
`;
}

export async function writeReport(directory: string) {
  const { runs, unreadable } = await readRuns(directory);
  const summary = summarize(runs, unreadable);
  await atomicJson(join(directory, "summary.json"), summary);
  const file = join(directory, "summary.md"); const temporary = `${file}.${randomUUID()}.tmp`;
  try { await writeFile(temporary, reportMarkdown(summary), { mode: 0o600, flag: "wx" }); await rename(temporary, file); }
  finally { await rm(temporary, { force: true }).catch(() => {}); }
  return summary;
}

export async function recordFeedback(directory: string, id: string, quality: string, reason?: string) {
  if (!validId(id) || !qualities.has(quality) || reason !== undefined && !reasons.has(reason)) throw new Error("Invalid feedback id, quality or reason");
  const run = JSON.parse(await readFile(join(directory, `${id}.run.json`), "utf8"));
  if (run.schemaVersion !== 1 || run.id !== id) throw new Error("Unknown run");
  if (run.execution === "started") throw new Error("Cannot assess an unfinished run");
  await atomicJson(join(directory, `${id}.feedback.json`), { id, quality, reason: reason ?? null, source: "explicit-feedback", recordedAt: new Date().toISOString() });
  return writeReport(directory);
}
