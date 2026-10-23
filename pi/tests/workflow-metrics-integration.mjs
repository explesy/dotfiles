import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readRuns } from '../.config/pi/lib/workflow-metrics.ts';

const agentDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), '.config/pi');
const { loadExtensions } = await import(pathToFileURL(join(agentDir, 'npm/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/loader.js')));
const source = fileURLToPath(new URL('../.config/pi/extensions/workflow.ts', import.meta.url));
const cwd = fileURLToPath(new URL('../../', import.meta.url));
async function fixture(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'pi-metrics-integration-'));
  const previous = process.env.PI_WORKFLOW_METRICS_DIR;
  process.env.PI_WORKFLOW_METRICS_DIR = join(root, 'state');
  t.after(async () => {
    if (previous === undefined) delete process.env.PI_WORKFLOW_METRICS_DIR;
    else process.env.PI_WORKFLOW_METRICS_DIR = previous;
    await rm(root, { recursive: true, force: true });
  });
  const loaded = await loadExtensions([source], cwd);
  assert.deepEqual(loaded.errors, []);
  const messages = [], notices = [];
  loaded.runtime.setModel = async () => !options.authFailure;
  loaded.runtime.setThinkingLevel = () => {};
  loaded.runtime.sendUserMessage = message => messages.push(message);
  const extension = loaded.extensions[0];
  const ctx = { cwd, sessionManager: { getSessionId: () => 'test-session' }, modelRegistry: { find: (provider, id) => ({ provider, id }) }, ui: { setStatus() {}, notify: (...notice) => notices.push(notice) } };
  const emit = async (type, value = {}) => {
    for (const handler of extension.handlers.get(type) || []) await handler({ type, ...value }, ctx);
  };
  return { extension, ctx, emit, messages, notices, directory: process.env.PI_WORKFLOW_METRICS_DIR };
}
async function settled(directory, condition) {
  const end = Date.now() + 2000;
  while (Date.now() < end) {
    const result = await readRuns(directory);
    if (condition(result.runs)) return result.runs;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('Metrics did not persist after settlement');
}

test('installed loader: finishing clears footer but metrics include final message until agent_settled', async t => {
  const { extension, ctx, emit, messages, directory } = await fixture(t);
  await extension.commands.get('i').handler('проверь CANARY_SECRET без изменений', ctx);
  assert.ok(messages[0].includes('CANARY_SECRET'));
  await extension.tools.get('workflow_status').definition.execute('phase', { phase: 'finishing' }, undefined, undefined, ctx);
  await emit('tool_execution_start', { toolCallId: 'check', toolName: 'bash', args: { command: 'npm test' } });
  await emit('tool_execution_end', { toolCallId: 'check', toolName: 'bash', isError: false, result: {} });
  await emit('message_end', { message: { role: 'assistant', content: [{ type: 'text', text: 'CANARY_SECRET' }], stopReason: 'stop', usage: { input: 2, output: 3, cost: { total: 0.001 } } } });
  await emit('agent_settled');
  const [run] = await settled(directory, runs => runs.length === 1 && runs[0].execution === 'settled');
  assert.equal(run.kind, 'task'); assert.equal(run.assistantMessages, 1); assert.equal(run.parentUsage.estimatedCost, 0.001);
  assert.equal(run.phases.finishing, 1); assert.equal(run.checks.tests.exitUnknown, 1);
  assert.ok(/^[a-f0-9]{16}$/.test(run.workflowRevision));
  assert.ok(!JSON.stringify(run).includes('CANARY_SECRET'));
  await emit('agent_settled'); await emit('session_shutdown');
  assert.equal((await readRuns(directory)).runs.length, 1);
});

test('installed loader: invalid input/auth failure/build do not create workflow metrics', async t => {
  const { extension, ctx, emit, directory } = await fixture(t, { authFailure: true });
  await extension.commands.get('i').handler('#0', ctx);
  await extension.commands.get('i').handler('task', ctx);
  await extension.commands.get('b').handler('task', ctx);
  await emit('message_end', { message: { role: 'assistant', usage: { cost: { total: 1 } } } });
  await emit('agent_settled'); await emit('session_shutdown');
  await assert.rejects(stat(directory), { code: 'ENOENT' });
});

test('installed loader: bare /i, queue and issue select metrics kinds; session switch interrupts only active run', async t => {
  const { extension, ctx, emit, directory } = await fixture(t);
  for (const [command, args] of [['i', ''], ['i', '#37'], ['i', '--next'], ['n', '']]) {
    await extension.commands.get(command).handler(args, ctx);
    await emit('agent_settled');
  }
  await extension.commands.get('i').handler('remaining task', ctx);
  await emit('session_switch'); await emit('session_shutdown');
  const runs = await settled(directory, rows => rows.length === 5 && rows.every(run => run.execution !== 'started'));
  assert.deepEqual(runs.map(run => run.kind).sort(), ['context', 'issue', 'queue', 'queue', 'task']);
  assert.equal(runs.filter(run => run.execution === 'interrupted').length, 1);
});
