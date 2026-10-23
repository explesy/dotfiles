import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { WorkflowMetrics, checkFamily, readRuns, summarize, reportMarkdown, recordFeedback } from '../.config/pi/lib/workflow-metrics.ts';

const info = { cwd: '/private/CANARY_SECRET/project', sessionId: 'CANARY_SECRET-session', kind: 'task', provider: 'opencode-go', model: 'deepseek-v4.1-flash', thinking: 'high' };
async function fixture(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'pi-metrics-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  let now = 1_800_000_000_000, clock = 100;
  const directory = join(root, 'state');
  const metrics = new WorkflowMetrics({ directory, revision: 'test-revision', now: () => now, monotonic: () => clock, ...options });
  return { root, directory, metrics, advance: ms => { now += ms; clock += ms; } };
}
async function onlyRun(directory) {
  const { runs, unreadable } = await readRuns(directory);
  assert.equal(unreadable, 0); assert.equal(runs.length, 1);
  return runs[0];
}

test('start checkpoint, settlement, UI wait, privacy and private permissions', async t => {
  const { metrics, directory, advance } = await fixture(t);
  metrics.start(info); await metrics.flush();
  const checkpoint = await onlyRun(directory);
  assert.equal(checkpoint.execution, 'started'); assert.equal(checkpoint.wallMs, null);
  assert.equal(summarize([checkpoint]).unfinished, 1);
  await assert.rejects(recordFeedback(directory, checkpoint.id, 'accepted'));
  metrics.recordPhase('implementing'); advance(100); metrics.pause(); metrics.pause();
  advance(200); metrics.resume(); metrics.resume(); advance(50);
  metrics.messageEnd({ role: 'user', content: 'CANARY_SECRET' });
  metrics.messageEnd({ role: 'assistant', content: 'CANARY_SECRET', stopReason: 'stop', usage: { input: 2, output: 3, cacheRead: 4, cacheWrite: 5, cost: { total: 0.01 } } });
  metrics.finish(); metrics.finish(); await metrics.flush();
  const run = await onlyRun(directory);
  assert.equal(run.wallMs, 350); assert.equal(run.uiWaitMs, 200); assert.equal(run.nonUiWallMs, 150);
  assert.equal(run.execution, 'settled'); assert.equal(run.quality, 'unverified');
  assert.equal(run.assistantMessages, 1); assert.equal(run.phases.implementing, 1);
  assert.equal(run.parentUsage.estimatedCost, 0.01);
  for (const file of await readdir(directory)) {
    assert.ok(!(await readFile(join(directory, file), 'utf8')).includes('CANARY_SECRET'));
    assert.equal((await stat(join(directory, file))).mode & 0o777, 0o600);
  }
  assert.equal((await stat(directory)).mode & 0o777, 0o700);
});

test('actual structured shell codes, unknown codes, interrupted checks and bounded categories', async t => {
  const { metrics, directory } = await fixture(t); metrics.start(info);
  const commands = ['npm test', 'npm run test:fast CANARY_SECRET', 'npm run build', 'npm run lint', 'npm test | customFilter', 'echo "npm test CANARY_SECRET"'];
  commands.forEach((command, i) => metrics.toolStart({ toolCallId: String(i), toolName: 'bash', args: { command } }));
  metrics.toolEnd({ toolCallId: '0', toolName: 'bash', isError: false, result: { content: [{ text: 'CANARY_SECRET' }] } });
  metrics.toolEnd({ toolCallId: '1', toolName: 'bash', isError: true, result: { details: { exitCode: 2 } } });
  metrics.toolEnd({ toolCallId: '2', toolName: 'bash', isError: false, result: { details: { exitCode: 0 } } });
  metrics.toolEnd({ toolCallId: '4', toolName: 'bash', isError: false, result: {} });
  metrics.toolEnd({ toolCallId: '5', toolName: 'bash', isError: false, result: {} });
  metrics.toolStart({ toolCallId: 'other', toolName: 'CANARY_SECRET-tool', args: {} });
  metrics.finish('interrupted'); await metrics.flush();
  const run = await onlyRun(directory);
  assert.equal(run.checks.tests.invocations, 2); assert.equal(run.checks.tests.exitUnknown, 1);
  assert.equal(run.checks.tests.exitNonzero, 1); assert.equal(run.checks.tests.toolError, 1);
  assert.equal(run.checks.build.exitZero, 1); assert.equal(run.checks.lint.noResult, 1);
  assert.equal(run.checks.lint.exitUnknown, 1); assert.equal(run.toolCalls.other, 1);
  assert.equal(run.execution, 'interrupted');
  assert.ok(!JSON.stringify(run).includes('CANARY_SECRET'));
  assert.equal(summarize([run]).repeatedTests, 1);
});

test('check recognition is conservative, language-neutral and never parses quoted logs', () => {
  for (const command of ['npm test', 'pnpm run test:unit', 'yarn test', 'npx vitest run a.ts', 'npm exec -- vitest run', 'node --test x.mjs', 'pytest tests', 'cargo test', 'go test ./...']) assert.equal(checkFamily(command), 'tests', command);
  assert.equal(checkFamily('npm run build'), 'build'); assert.equal(checkFamily('npm run lint'), 'lint');
  for (const command of ['echo npm test', 'npm test; true', 'cd a && npm test', 'npm test | tail', 'npm test > x', 'npm test\ntrue', 'echo "npm test"', 'npm test $(echo secret)', 'npm test `echo secret`', 'node tool.mjs', undefined]) assert.equal(checkFamily(command), undefined, String(command));
});

test('parent and helper usage are separate, deduplicated and do not include session totals', async t => {
  const { metrics, directory } = await fixture(t); metrics.start(info);
  metrics.messageEnd({ role: 'assistant', stopReason: 'stop', usage: { input: 10, output: 20, cost: { total: 0.1 } } });
  const result = { details: { runId: 'child-run', results: [{ index: 0, task: 'CANARY_SECRET', artifactPaths: '/CANARY_SECRET', usage: { input: 30, output: 40, cost: 0.2 } }] } };
  for (const id of ['helper-1', 'helper-2']) {
    metrics.toolStart({ toolCallId: id, toolName: 'subagent', args: { task: 'CANARY_SECRET' } });
    metrics.toolEnd({ toolCallId: id, toolName: 'subagent', isError: false, result });
  }
  metrics.toolEnd({ toolCallId: 'unobserved-old-run', toolName: 'subagent', result });
  metrics.finish(); await metrics.flush();
  const run = await onlyRun(directory), summary = summarize([run]);
  assert.equal(run.helpersObserved, 1); assert.equal(run.helperUsage.estimatedCost, 0.2);
  assert.ok(Math.abs(summary.groups[0].estimatedCost - 0.3) < 1e-9);
  assert.equal(summary.groups[0].observedTokens, 100);
  assert.ok(!JSON.stringify(run).includes('CANARY_SECRET'));
});

test('missing usage and recovered provider errors are visible without judging quality', async t => {
  const { metrics, directory } = await fixture(t); metrics.start(info);
  metrics.messageEnd({ role: 'assistant', stopReason: 'error', errorMessage: 'CANARY_SECRET' });
  metrics.messageEnd({ role: 'assistant', stopReason: 'stop', usage: { cost: { total: 0 } } });
  metrics.routingChanged(); metrics.finish(); await metrics.flush();
  const run = await onlyRun(directory), summary = summarize([run]);
  assert.equal(run.execution, 'settled'); assert.equal(run.modelErrors, 1);
  assert.equal(run.parentUsage.missingCost, 1); assert.equal(run.quality, 'unverified');
  assert.equal(summary.groups[0].mixedRouting, 1);
});

test('blocked/aborted/model-error and superseded runs have distinct execution outcomes', async t => {
  const { metrics, directory, advance } = await fixture(t);
  metrics.start(info); metrics.recordPhase('blocked'); metrics.finish(); advance(1);
  metrics.start(info); metrics.messageEnd({ role: 'assistant', stopReason: 'aborted' }); metrics.finish(); advance(1);
  metrics.start(info); metrics.messageEnd({ role: 'assistant', stopReason: 'error' }); metrics.finish(); advance(1);
  metrics.start(info); advance(1); metrics.start(info); metrics.finish(); await metrics.flush();
  assert.deepEqual((await readRuns(directory)).runs.map(run => run.execution).sort(), ['aborted', 'blocked', 'model-error', 'settled', 'superseded']);
});

test('disabled collection creates no files and write failure is fail-open with one warning', async t => {
  const { metrics, directory, root } = await fixture(t, { enabled: false }); metrics.start(info); metrics.finish(); await metrics.flush();
  await assert.rejects(stat(directory), { code: 'ENOENT' });
  const blocker = join(root, 'file-not-directory'); await writeFile(blocker, 'test');
  let warnings = 0;
  const failed = new WorkflowMetrics({ revision: 'test', directory: blocker, onError: () => { warnings++; throw new Error('notification failed'); } });
  failed.start(info); failed.finish(); await failed.flush(); failed.start(info); failed.finish(); await failed.flush();
  assert.equal(warnings, 1); assert.equal(await readFile(blocker, 'utf8'), 'test');
});

test('concurrent instances preserve distinct run files; report can always rebuild from source', async t => {
  const { metrics, directory } = await fixture(t);
  const second = new WorkflowMetrics({ directory, revision: 'other-revision' });
  metrics.start(info); second.start(info); metrics.finish(); second.finish();
  await Promise.all([metrics.flush(), second.flush()]);
  const { runs } = await readRuns(directory); assert.equal(runs.length, 2);
  assert.equal(new Set(runs.map(run => run.id)).size, 2); assert.equal(summarize(runs).groups.length, 2);
  assert.equal((await readdir(directory)).some(file => file.endsWith('.tmp')), false);
});

test('explicit feedback alone changes quality; invalid IDs and unfinished runs reject', async t => {
  const { metrics, directory } = await fixture(t); metrics.start(info); metrics.finish(); await metrics.flush();
  const run = await onlyRun(directory); assert.equal(run.quality, 'unverified');
  const accepted = await recordFeedback(directory, run.id, 'accepted'); assert.equal(accepted.quality.accepted, 1);
  const repaired = await recordFeedback(directory, run.id, 'needs-fixes', 'contract'); assert.equal(repaired.quality['needs-fixes'], 1);
  assert.equal((await onlyRun(directory)).feedbackReason, 'contract');
  await assert.rejects(recordFeedback(directory, '../outside', 'accepted'));
  await assert.rejects(recordFeedback(directory, run.id, 'green'));
  await assert.rejects(recordFeedback(directory, run.id, 'accepted', 'CANARY_SECRET'));
  await recordFeedback(directory, run.id, 'unverified');
  assert.equal((await onlyRun(directory)).quality, 'unverified');
});

test('report reads at most 200 newest records, exposes malformed data and has no fake success conclusion', async t => {
  const { metrics, directory } = await fixture(t); metrics.start(info); metrics.finish(); await metrics.flush();
  const run = await onlyRun(directory);
  await Promise.all(Array.from({ length: 205 }, async (_, i) => {
    const id = `${1_900_000_000_000 + i}-${randomUUID()}`;
    await writeFile(join(directory, `${id}.run.json`), JSON.stringify({ ...run, id }));
  }));
  const corruptId = `1999999999999-${randomUUID()}`; await writeFile(join(directory, `${corruptId}.run.json`), '{bad-json');
  const { runs, unreadable } = await readRuns(directory);
  assert.equal(runs.length, 199); assert.equal(unreadable, 1);
  const report = reportMarkdown(summarize(runs, unreadable));
  assert.ok(report.includes('не проверено 199')); assert.ok(report.includes('нечитаемых записей: 1'));
  assert.ok(!report.includes('CANARY_SECRET')); assert.ok(report.includes('не меняют правила'));
});

test('CLI reports empty state without writes and rejects feedback traversal safely', async t => {
  const { directory } = await fixture(t);
  const script = new URL('../scripts/workflow-report.mjs', import.meta.url);
  const env = { ...process.env, PI_WORKFLOW_METRICS_DIR: directory };
  const empty = spawnSync(process.execPath, [script.pathname], { env, encoding: 'utf8' });
  assert.equal(empty.status, 0); assert.ok(empty.stdout.includes('Последние 0 запусков'));
  await assert.rejects(stat(directory), { code: 'ENOENT' });
  const invalid = spawnSync(process.execPath, [script.pathname, '--feedback', '../CANARY_SECRET', 'accepted'], { env, encoding: 'utf8' });
  assert.equal(invalid.status, 1); assert.equal(invalid.stdout, ''); assert.ok(!invalid.stderr.includes('CANARY_SECRET'));
});


test('display wrappers expose check invocation but never confirm its individual exit status', async t => {
  const { metrics, directory } = await fixture(t); metrics.start(info);
  const commands = ['npm test 2>&1; echo "EXIT_CODE=$?"', 'npx vitest run x.ts 2>&1 | tail -40', 'npm run build 2>&1', 'npm test; echo "EXIT_STATUS=$?"'];
  for (const [i, command] of commands.entries()) {
    assert.ok(checkFamily(command));
    metrics.toolStart({ toolCallId: String(i), toolName: 'bash', args: { command } });
    metrics.toolEnd({ toolCallId: String(i), toolName: 'bash', isError: false, result: { details: { exitCode: 0 } } });
  }
  metrics.finish(); await metrics.flush();
  const run = await onlyRun(directory);
  assert.equal(run.checks.tests.invocations, 3); assert.equal(run.checks.tests.exitUnknown, 3);
  assert.equal(run.checks.tests.exitZero, 0); assert.equal(run.checks.build.exitUnknown, 1);
  assert.equal(checkFamily('echo "npm test 2>&1; echo EXIT_CODE=$?"'), undefined);
  assert.equal(checkFamily('npm test; echo "EXIT_CODE=$(secret)"'), undefined);
});
