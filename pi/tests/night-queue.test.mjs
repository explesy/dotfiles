import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync } from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseHours,sortIssues,branchFor,evaluateRun,describeEvent,evaluatePrComments} from '../.config/pi/night/night-queue.mjs';

const runner = fileURLToPath(new URL('../.config/pi/night/night-queue.mjs', import.meta.url));
const exec = (exe,args,cwd,env=process.env) => {
  const r=spawnSync(exe,args,{cwd,env,encoding:'utf8',timeout:15000});
  assert.equal(r.status,0,`${exe} ${args}: ${r.stderr}`);
  return r.stdout.trim();
};

test('night queue input and failure gates',()=>{
 assert.equal(parseHours(),8);
 assert.equal(parseHours('0.5'),.5);
 for(const x of ['0','25','NaN','-5']) assert.throws(()=>parseHours(x));
 assert.equal(branchFor(8),'agent/night/issue-8');
 assert.deepEqual(sortIssues([{number:8,labels:[{name:'agent:blocked'}]},{number:9},{number:1},{number:2,pull_request:{}}]).map(x=>x.number),[1,9]);
 assert.equal(evaluateRun({settled:true,failed:false,blocked:false},0).ok,true);
 assert.equal(evaluateRun({settled:false,failed:true},0).ok,false);
 assert.match(describeEvent({type:'tool_execution_start',toolName:'bash',args:{command:'npm test'}}),/npm test/);
 assert.equal(describeEvent({type:'agent_settled',aborted:true}),'Pi остановлен/прерван');
 for(const [events,exit] of [[{settled:false},0],[{settled:true,failed:true},0],[{settled:true,blocked:true},0],[{settled:true},1]]) assert.equal(evaluateRun(events,exit).ok,false);
});

test('foreground queue streams progress, invokes /i, creates isolated branch and draft PR',()=>{
 const temp=mkdtempSync(join(tmpdir(),'pi-night-test-'));
 const root=join(temp,'repo'), origin=join(temp,'remote.git'),bin=join(temp,'bin');mkdirSync(root);mkdirSync(bin);
 exec('git',['init','--bare',origin],temp);
 exec('git',['init','-b','main'],root);
 exec('git',['config','user.email','test@example.org'],root);
 exec('git',['config','user.name','CI Test'],root);
 writeFileSync(join(root,'README.md'),'original\n');
 exec('git',['add','README.md'],root);exec('git',['commit','-m','initial'],root);
 exec('git',['remote','add','origin',origin],root);exec('git',['push','-u','origin','main'],root);
 const fakeGh=`#!/usr/bin/env node
const {appendFileSync}=require('node:fs');
const a=process.argv.slice(2);
if(a[0]==='auth'||a[0]==='--version') process.exit(0);
if(a[0]==='repo') console.log(JSON.stringify({nameWithOwner:'test/repo',defaultBranchRef:{name:'main'}}));
else if(a[0]==='issue'&&a[1]==='list') console.log(JSON.stringify([{number:10,title:'Small task',labels:[{name:'agent:night'}]},{number:11,title:'Blocked task',labels:[{name:'agent:night'},{name:'agent:blocked'}]}]));
else if(a[0]==='issue'&&a[1]==='view') console.log(JSON.stringify({number:10,state:'OPEN',body:'Test',title:'Small task',labels:[{name:'agent:night'}]}));
else if(a[0]==='pr'&&a[1]==='list') console.log('[]');
else if(a[0]==='pr'&&a[1]==='create') {appendFileSync(process.env.MOCK_RECORD,JSON.stringify(a)+'\\n');console.log('https://github.test/pr/1');}
else { console.error('Unexpected gh',a);process.exit(1);}
`;
 const fakePi=`#!/usr/bin/env node
const {writeFileSync,appendFileSync}=require('node:fs');
const cp=require('node:child_process');
const a=process.argv.slice(2);
if(a[0]==='--version') {console.log('pi 1.2.0');process.exit(0)}
appendFileSync(process.env.MOCK_PI_RECORD,JSON.stringify(a)+'\\n');
writeFileSync('work.txt','night output\\n');
for(const xs of [['add','work.txt'],['commit','-m','implement issue 10']]) {const r=cp.spawnSync('git',xs,{encoding:'utf8'});if(r.status!==0){console.error(r.stderr);process.exit(1)}}
console.log(JSON.stringify({type:'tool_execution_start',toolName:'bash',args:{command:'npm test'}}));
console.log(JSON.stringify({type:'agent_settled',aborted:false}));
`;
 writeFileSync(join(bin,'gh'),fakeGh,{mode:0o755});writeFileSync(join(bin,'pi'),fakePi,{mode:0o755});
 const env={...process.env,PATH:`${bin}:${process.env.PATH}`,MOCK_RECORD:join(temp,'gh-prs.log'),MOCK_PI_RECORD:join(temp,'pi-prompts.log')};
 const out=exec(process.execPath,[runner,'foreground','0.01'],root,env);
 assert.match(out,/\[night\] #10: инструмент bash — npm test/);
 assert.match(out,/\[night\] #10: Pi завершил работу/);
 const stateFile=join(root,'.git','pi-night','state.json');
 const state=JSON.parse(readFileSync(stateFile,'utf8'));
 assert.equal(state?.status,'finished',JSON.stringify(state));
 const readback=JSON.parse(exec(process.execPath,[runner,'status'],root,env));
 assert.equal(readback.running,false);
 assert.equal(readback.status,'finished');
 assert.equal(state.issues['10'].status,'pr-created');
 assert.equal(state.issues['11'],undefined);
 const prompts=readFileSync(env.MOCK_PI_RECORD,'utf8');
 assert.match(prompts,/Execute GitHub issue #10/);
 assert.match(prompts,/Night queue authorization/);
 assert.match(prompts,/deepseek-v4.1-flash/);
 assert.doesNotMatch(prompts,/issue #11/);
 const pr=readFileSync(env.MOCK_RECORD,'utf8');
 assert.match(pr,/--draft/);
 assert.match(exec('git',['branch','--list','agent/night/issue-10'],root),/issue-10/);
});

test('night queue executes directly when invoked via a symlinked path', () => {
 const temp = mkdtempSync(join(tmpdir(), 'pi-night-symlink-'));
 const linkPath = join(temp, 'symlinked-runner.mjs');
 symlinkSync(runner, linkPath);
 const root = join(temp, 'repo');
 mkdirSync(root);
 exec('git', ['init'], root);
 const out = exec(process.execPath, [linkPath, 'status'], root);
 const parsed = JSON.parse(out);
 assert.equal(parsed.running, false);
 assert.equal(parsed.status, 'never-started');
});

test('evaluatePrComments handles fresh comments and already-performed work', () => {
 // No PR exists
 assert.deepEqual(evaluatePrComments([], { comments: [] }), { hasPr: false, shouldRun: true });

 // PR merged
 const mergedPr = [{ number: 1, state: 'MERGED' }];
 assert.equal(evaluatePrComments(mergedPr, {}).shouldRun, false);
 assert.match(evaluatePrComments(mergedPr, {}).reason, /merged/);

 // PR closed
 const closedPr = [{ number: 2, state: 'CLOSED' }];
 assert.equal(evaluatePrComments(closedPr, {}).shouldRun, false);
 assert.match(evaluatePrComments(closedPr, {}).reason, /closed/);

 // Open PR without comments
 const openPrNoComments = [{
   number: 3,
   state: 'OPEN',
   commits: [{ committedDate: '2026-10-20T10:00:00Z' }],
   comments: [],
   reviews: [],
 }];
 const resNoComments = evaluatePrComments(openPrNoComments, { comments: [] });
 assert.equal(resNoComments.shouldRun, false);
 assert.match(resNoComments.reason, /up to date/);

 // Open PR with comment older than latest commit (work already done)
 const openPrOldComment = [{
   number: 4,
   state: 'OPEN',
   commits: [{ committedDate: '2026-10-20T12:00:00Z' }],
   comments: [{ author: { login: 'reviewer' }, body: 'please fix', createdAt: '2026-10-20T11:00:00Z' }],
   reviews: [],
 }];
 const resOldComment = evaluatePrComments(openPrOldComment, { comments: [] });
 assert.equal(resOldComment.shouldRun, false);
 assert.match(resOldComment.reason, /work already done/);

 // Open PR with comment newer than latest commit (rework required)
 const openPrFreshComment = [{
   number: 5,
   state: 'OPEN',
   commits: [{ committedDate: '2026-10-20T10:00:00Z' }],
   comments: [{ author: { login: 'explesy' }, body: 'follow-up required', createdAt: '2026-10-20T11:00:00Z' }],
   reviews: [],
 }];
 const resFreshComment = evaluatePrComments(openPrFreshComment, { comments: [] });
 assert.equal(resFreshComment.shouldRun, true);
 assert.match(resFreshComment.reason, /fresh comment from explesy/);

 // Fresh comment in issue instead of PR
 const openPrIssueComment = [{
   number: 6,
   state: 'OPEN',
   commits: [{ committedDate: '2026-10-20T10:00:00Z' }],
   comments: [],
   reviews: [],
 }];
 const resIssueComment = evaluatePrComments(openPrIssueComment, {
   comments: [{ author: { login: 'owner' }, body: 'rework issue criteria', createdAt: '2026-10-20T11:30:00Z' }],
 });
 assert.equal(resIssueComment.shouldRun, true);
 assert.match(resIssueComment.reason, /fresh comment from owner/);

 // PR review with CHANGES_REQUESTED newer than latest commit
 const openPrReviewChanges = [{
   number: 7,
   state: 'OPEN',
   commits: [{ committedDate: '2026-10-20T10:00:00Z' }],
   comments: [],
   reviews: [{ author: { login: 'reviewer' }, state: 'CHANGES_REQUESTED', body: 'fix tests', submittedAt: '2026-10-20T12:00:00Z' }],
 }];
 const resReview = evaluatePrComments(openPrReviewChanges, { comments: [] });
 assert.equal(resReview.shouldRun, true);

 // Local worktree commit is newer than comment
 const localCommitTime = Date.parse('2026-10-20T13:00:00Z');
 const resLocalAhead = evaluatePrComments(openPrFreshComment, { comments: [] }, localCommitTime);
 assert.equal(resLocalAhead.shouldRun, false);
 assert.match(resLocalAhead.reason, /work already done/);
});

test('night queue continues work on existing PR with fresh review comment and pushes pr-updated', () => {
 const temp = mkdtempSync(join(tmpdir(), 'pi-night-rework-test-'));
 const root = join(temp, 'repo'), origin = join(temp, 'remote.git'), bin = join(temp, 'bin');
 mkdirSync(root); mkdirSync(bin);
 exec('git', ['init', '--bare', origin], temp);
 exec('git', ['init', '-b', 'main'], root);
 exec('git', ['config', 'user.email', 'test@example.org'], root);
 exec('git', ['config', 'user.name', 'CI Test'], root);
 writeFileSync(join(root, 'README.md'), 'original\n');
 exec('git', ['add', 'README.md'], root);
 exec('git', ['commit', '-m', 'initial'], root);
 exec('git', ['remote', 'add', 'origin', origin], root);
 exec('git', ['push', '-u', 'origin', 'main'], root);

 // Create the remote feature branch with initial commit
 exec('git', ['checkout', '-b', 'agent/night/issue-20'], root);
 writeFileSync(join(root, 'feature.txt'), 'initial draft\n');
 exec('git', ['add', 'feature.txt'], root);
 exec('git', ['commit', '-m', 'initial draft for issue 20'], root);
 exec('git', ['push', '-u', 'origin', 'agent/night/issue-20'], root);
 exec('git', ['checkout', 'main'], root);

 const fakeGh = `#!/usr/bin/env node
const a = process.argv.slice(2);
if (a[0] === 'auth' || a[0] === '--version') process.exit(0);
if (a[0] === 'repo') console.log(JSON.stringify({ nameWithOwner: 'test/repo', defaultBranchRef: { name: 'main' } }));
else if (a[0] === 'issue' && a[1] === 'list') {
  console.log(JSON.stringify([{ number: 20, title: 'Rework task', labels: [{ name: 'agent:night' }] }]));
} else if (a[0] === 'issue' && a[1] === 'view') {
  console.log(JSON.stringify({ number: 20, state: 'OPEN', body: 'Test', title: 'Rework task', labels: [{ name: 'agent:night' }], comments: [] }));
} else if (a[0] === 'pr' && a[1] === 'list') {
  console.log(JSON.stringify([{
    number: 55,
    url: 'https://github.test/pr/55',
    state: 'OPEN',
    commits: [{ committedDate: '2026-10-20T05:00:00Z' }],
    comments: [{ author: { login: 'explesy' }, body: 'Please fix edge case', createdAt: '2026-10-20T10:00:00Z' }],
    reviews: []
  }]));
} else {
  console.error('Unexpected gh', a);
  process.exit(1);
}
`;

 const fakePi = `#!/usr/bin/env node
const { writeFileSync, appendFileSync } = require('node:fs');
const cp = require('node:child_process');
const a = process.argv.slice(2);
if (a[0] === '--version') { console.log('pi 1.2.0'); process.exit(0); }
appendFileSync(process.env.MOCK_PI_RECORD, JSON.stringify(a) + '\\n');
writeFileSync('feature.txt', 'reworked feature with edge case fix\\n');
for (const xs of [['add', 'feature.txt'], ['commit', '-m', 'fix edge case per review']]) {
  const r = cp.spawnSync('git', xs, { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
}
console.log(JSON.stringify({ type: 'tool_execution_start', toolName: 'bash', args: { command: 'npm test' } }));
console.log(JSON.stringify({ type: 'agent_settled', aborted: false }));
`;

 writeFileSync(join(bin, 'gh'), fakeGh, { mode: 0o755 });
 writeFileSync(join(bin, 'pi'), fakePi, { mode: 0o755 });
 const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, MOCK_PI_RECORD: join(temp, 'pi-prompts.log') };

 const out = exec(process.execPath, [runner, 'foreground', '0.01'], root, env);
 assert.match(out, /#20: обнаружен PR #55 со свежими комментариями/);
 assert.match(out, /#20: pr-updated/);

 const prompts = readFileSync(env.MOCK_PI_RECORD, 'utf8');
 assert.match(prompts, /Existing Pull Request: #55/);
 assert.match(prompts, /read the latest PR comments/i);

 // Check that remote feature branch received the new commit
 const remoteLog = exec('git', ['log', 'origin/agent/night/issue-20', '--oneline'], root);
 assert.match(remoteLog, /fix edge case per review/);
});
