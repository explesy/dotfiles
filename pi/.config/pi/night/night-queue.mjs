#!/usr/bin/env node
// Pi night queue: intentionally delegates all implementation to the existing /i command.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync, createReadStream, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const LABEL = 'agent:night';
const MAX_HOURS = 24;
const MAX_ISSUES = 100;
const EXTRA = 'Night queue authorization: implement ONLY this issue using the existing /i policy. You may create commits on this dedicated agent/night/issue-N branch and push it and open a draft PR. Do not merge, deploy, alter production, or make destructive external changes. Commit only intended task files (never credentials); run required checks, and explicitly report blockers instead of claiming success.';

export function parseHours(input = '8') {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_HOURS) throw new Error('Hours must be > 0 and <= 24');
  return value;
}
export function branchFor(number) { return `agent/night/issue-${number}`; }
export function sortIssues(issues) {
  return issues.filter(x => Number.isSafeInteger(x.number) && x.number > 0 &&
    !x.pull_request && !x.labels?.some(l => ['agent:blocked', 'blocked'].includes(typeof l === 'string' ? l : l.name)))
    .sort((a, b) => a.number - b.number);
}
export function evaluateRun(events, exitCode) {
  if (exitCode !== 0) return { ok: false, reason: `Pi exited ${exitCode}` };
  if (!events.settled) return { ok: false, reason: 'Pi did not report agent_settled' };
  if (events.failed) return { ok: false, reason: 'Pi reported a model/extension failure' };
  if (events.blocked) return { ok: false, reason: 'Agent reported blocked' };
  return { ok: true };
}
const cmd = (file, args, cwd, options={}) => {
  const result = spawnSync(file, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(`${file} ${args.slice(0,3).join(' ')}: ${(result.stderr || result.error?.message || `exit ${result.status}`).trim().slice(0,500)}`);
  return result.stdout.trim();
};
const jsonCmd = (file, args, cwd) => JSON.parse(cmd(file, args, cwd));
const save = (path, object) => {
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(object, null, 2) + '\n', {mode:0o600});
  renameSync(tmp, path);
};
const load = (path, fallback={}) => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
const alive = pid => Number.isSafeInteger(pid) && pid > 0 && (() => { try { process.kill(pid, 0); return true; } catch(e) { return e.code === 'EPERM'; } })();
function context(cwd) {
  const root = cmd('git', ['rev-parse', '--show-toplevel'], cwd);
  const gitDir = cmd('git', ['rev-parse', '--absolute-git-dir'], root);
  const stateDir = join(gitDir, 'pi-night');
  mkdirSync(stateDir, { recursive: true, mode:0o700 });
  return {root, stateDir, lock:join(stateDir,'lock.json'), stateFile:join(stateDir,'state.json'), stopFile:join(stateDir,'stop')};
}
function verify(context) {
  cmd('gh', ['auth','status'], context.root);
  cmd('pi', ['--version'], context.root);
  const repo = jsonCmd('gh', ['repo','view','--json','nameWithOwner,defaultBranchRef'], context.root);
  if (!repo?.nameWithOwner || !repo.defaultBranchRef?.name) throw new Error('Cannot resolve GitHub repo/default branch');
  return {repo:repo.nameWithOwner, base:repo.defaultBranchRef.name};
}
function existingLock(c) {
  const lock = load(c.lock, null);
  if (lock && alive(lock.pid)) return lock;
  if (lock && Date.now() - (lock.createdAt || 0) < 15_000) return lock;
  if (lock) unlinkSync(c.lock);
  return null;
}
function acquire(c, hours) {
  if (existingLock(c)) throw new Error('Night runner already started');
  const fd = openSync(c.lock, 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify({pid:0,createdAt:Date.now(),hours})); }
  finally { closeSync(fd); }
}
function isStopped(c) { return existsSync(c.stopFile); }
function log(c, text) { console.log(`[night] ${text}`); }
function readStatus(c) {
  const lock = load(c.lock, null);
  return {running: Boolean(lock && alive(lock.pid)), pid:lock?.pid || null, stopRequested:isStopped(c), ...load(c.stateFile,{status:'never-started',issues:{}})};
}
function launch(c, hours) {
  verify(c);
  acquire(c, hours);
  try {
    if (existsSync(c.stopFile)) unlinkSync(c.stopFile);
    const script = resolve(process.argv[1]);
    const childArgs = [script, 'run', String(hours), c.root];
    const useCaffeinate = process.platform === 'darwin';
    const child = spawn(useCaffeinate ? 'caffeinate' : process.execPath,
      useCaffeinate ? ['-is', process.execPath, ...childArgs] : childArgs,
      { cwd:c.root, detached:true, stdio:'ignore', env:process.env });
    if (!child.pid) throw new Error('Cannot start background runner');
    save(c.lock, {pid: child.pid, createdAt: Date.now(), hours});
    child.unref();
    log(c, `started PID ${child.pid}, ${hours}h; status: /night status`);
  } catch(e) { if (existsSync(c.lock)) unlinkSync(c.lock); throw e; }
}
async function inspectJsonLog(path) {
  const flags = {settled:false, blocked:false, failed:false};
  const rl = createInterface({ input:createReadStream(path), crlfDelay:Infinity });
  for await (const line of rl) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.type === 'agent_settled') flags.settled = true;
    if (e.type === 'extension_error') flags.failed = true;
    if (e.type === 'message_end' && e.message?.role === 'assistant' && ['error','aborted','length'].includes(e.message?.stopReason)) flags.failed = true;
    if (e.type === 'tool_execution_end' && e.toolName === 'workflow_status' && (e.result?.details?.phase === 'blocked' || e.result?.details?.phase === 'finishing' && e.result?.isError)) flags.blocked = true;
  }
  return flags;
}
async function executePi(c, worktree, issue, attempts, state) {
  const logdir = join(c.stateDir,'logs'); mkdirSync(logdir,{recursive:true,mode:0o700});
  const stdoutFile = join(logdir,`${Date.parse(state.startedAt)}-${issue.number}-${attempts}.jsonl`);
  const stderrFile = join(logdir,`${Date.parse(state.startedAt)}-${issue.number}-${attempts}.stderr.log`);
  const out = openSync(stdoutFile, 'w', 0o600), err = openSync(stderrFile, 'w', 0o600);
  const sessionDir = join(c.stateDir, 'sessions', String(issue.number));
  mkdirSync(sessionDir,{recursive:true,mode:0o700});
  const args = ['--mode','json', '--session-dir',sessionDir];
  // Same session and worktree on retries; the /i route still owns the task.
  if (attempts > 1 || readdirSync(sessionDir).some(x => x.endsWith('.jsonl'))) args.push('--continue');
  args.push(`/i #${issue.number} ${EXTRA.replaceAll('issue-N',`issue-${issue.number}`)}`);
  let status;
  try {
    status = await new Promise((done,reject) => {
      const child = spawn('pi',args,{cwd:worktree, stdio:['ignore',out,err]});
      child.on('error',reject);
      child.on('close',(code,signal) => done({code,signal}));
    });
  } finally {closeSync(out); closeSync(err);}
  const flags = await inspectJsonLog(stdoutFile);
  const result = evaluateRun(flags,status.code ?? 1);
  state.issues[issue.number] = {...state.issues[issue.number], flags, piExitCode:status.code, piSignal:status.signal, stdoutFile, stderrFile, lastResult:result};
  save(c.stateFile,state);
  return result;
}
const gh = (args, cwd) => cmd('gh', args, cwd);
const prList = (repo, branch, cwd) => jsonCmd('gh',['pr','list','-R',repo,'--head',branch,'--state','all','--json','number,url','--limit','100'],cwd);
function worktreeFor(c, number) {return join(dirname(c.root), `${basename(c.root)}-night-worktrees`, `issue-${number}`);}
async function handleIssue(c, repo, base, issue, state) {
  const branch = branchFor(issue.number);
  if (prList(repo, branch, c.root).length) return {status:'pr-exists', reason:'PR already exists'};
  const item = jsonCmd('gh',['issue','view',String(issue.number),'-R',repo,'--json','number,state,body,title,labels'],c.root);
  if (item.state !== 'OPEN' || !item.labels?.some(l=>l.name===LABEL)) return {status:'skipped',reason:'Not open/labeled'};
  if (item.labels.some(l=>['agent:blocked','blocked'].includes(l.name))) return {status:'skipped',reason:'Blocked label'};
  const dir = worktreeFor(c, issue.number);
  mkdirSync(dirname(dir),{recursive:true});
  if (!existsSync(dir)) {
    // Remote branch existing without a PR is ambiguous: do not overwrite it.
    const existing = spawnSync('git',['ls-remote','--exit-code','--heads','origin',branch],{cwd:c.root,encoding:'utf8'});
    if (existing.status===0) return {status:'skipped',reason:'Remote branch exists without a PR'};
    if (existing.status!==2) throw new Error('Cannot verify remote branch state');
    cmd('git',['worktree','add','-b',branch,dir,`origin/${base}`],c.root);
  } else {
    if (cmd('git',['branch','--show-current'],dir)!==branch ||
        cmd('git',['rev-parse','--path-format=absolute','--git-common-dir'],dir) !==
        cmd('git',['rev-parse','--path-format=absolute','--git-common-dir'],c.root)) {
      throw new Error(`Worktree does not belong to this repository/branch: ${dir}`);
    }
  }
  const prev = state.issues[issue.number];
  const attempts = (prev?.attempts || 0) + 1;
  state.issues[issue.number] = {status:'running',attempts,branch,worktree:dir,startedAt:new Date().toISOString()}; save(c.stateFile,state);
  let result = await executePi(c,dir,issue,attempts,state);
  if (!result.ok && attempts < 2 && !state.issues[issue.number].flags?.blocked) {
    log(c, `#${issue.number} recoverable failure: ${result.reason}; retrying once`);
    state.issues[issue.number].attempts = attempts + 1; save(c.stateFile,state);
    result = await executePi(c,dir,issue,attempts+1,state);
  }
  if (!result.ok) return {status:'blocked',reason:result.reason};
  // Never stage arbitrary agent output; /i must explicitly commit its intended changes.
  if (cmd('git',['status','--porcelain'],dir)) return {status:'blocked', reason:'Uncommitted changes; refused automatic staging'};
  const count = Number(cmd('git',['rev-list','--count',`origin/${base}..HEAD`],dir));
  if (!count) return {status:'blocked', reason:'No implementation commits to propose'};
  cmd('git',['diff','--check',`origin/${base}...HEAD`],dir);
  // /i is permitted to create the draft PR itself; avoid duplicates.
  if (prList(repo,branch,dir).length) return {status:'pr-created',reason:'PR created by /i'};
  cmd('git',['push','--set-upstream','origin',branch],dir);
  const title = `Agent night: #${issue.number} ${issue.title}`.slice(0,180);
  const body = `Draft implementation of #${issue.number} via existing Pi /i workflow.\n\nAutomated checks and remaining limitations: see commits and night session logs. Human review required; no auto-merge or deploy.\n\nCloses nothing automatically.`;
  const url = gh(['pr','create','-R',repo,'--draft','--base',base,'--head',branch,'--title',title,'--body',body],dir);
  return {status:'pr-created',url};
}
async function run(c,hours) {
  const lock = load(c.lock, null);
  // Starter updates the lock just after spawn; let that atomic handoff complete.
  let owner = lock;
  for (let i=0; i<20 && (!owner?.pid || !alive(owner.pid)); i++) {
    await new Promise(done=>setTimeout(done,100));
    owner = load(c.lock,null);
  }
  if (!owner?.pid || !alive(owner.pid)) throw new Error('No live owner lock');
  const deadline = Date.now() + hours*60*60*1000;
  const state = {status:'running',startedAt:new Date().toISOString(),deadline:new Date(deadline).toISOString(),issues:{}};
  save(c.stateFile,state);
  try {
    const {repo,base} = verify(c);
    state.repo = repo; state.base = base; save(c.stateFile,state);
    cmd('git',['fetch','origin',base],c.root);
    const queue = sortIssues(jsonCmd('gh',['issue','list','-R',repo,'--state','open','--label',LABEL,'--json','number,title,labels,url','--limit',String(MAX_ISSUES)],c.root));
    log(c, `${queue.length} eligible labeled issues`);
    for(const issue of queue) {
      if (isStopped(c) || Date.now()>=deadline) break;
      try {
        const result = await handleIssue(c,repo,base,issue,state);
        state.issues[issue.number] = {...state.issues[issue.number],...result,finishedAt:new Date().toISOString()};
        log(c, `#${issue.number}: ${result.status}${result.reason?` (${result.reason})`:''}`);
      } catch(e) {
        state.issues[issue.number] = {...state.issues[issue.number],status:'blocked',reason:e.message,finishedAt:new Date().toISOString()};
        log(c, `#${issue.number}: blocked (${e.message})`);
      }
      save(c.stateFile,state);
    }
    state.status = isStopped(c)?'stopped':Date.now()>=deadline?'time-window-ended':'finished';
  } catch(e) { state.status='error';state.error=e.message;throw e; }
  finally {
    state.finishedAt=new Date().toISOString();save(c.stateFile,state);
    // Remove only our lock. On macOS caffeinate PID stays alive until this process exits.
    if (existsSync(c.lock) && load(c.lock).pid===owner.pid) unlinkSync(c.lock);
  }
}
async function main() {
  const [action='status',arg='8',root=process.cwd()] = process.argv.slice(2);
  const c = context(root);
  if (action==='status') {console.log(JSON.stringify(readStatus(c),null,2));return;}
  if (action==='stop') {if (!existingLock(c)) {log(c,'no runner active');return;}writeFileSync(c.stopFile,'stop\n');log(c,'stop requested; current /i will finish');return;}
  if (action==='start') {launch(c,parseHours(arg));return;}
  if (action==='run') {await run(c,parseHours(arg));return;}
  throw new Error('Usage: /night start [hours] | /night status | /night stop');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e=>{console.error(`[night] ${e.stack||e}`);process.exitCode=1;});
}
