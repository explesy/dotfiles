import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseHours,sortIssues,branchFor,evaluateRun} from '../.config/pi/extensions/night-queue.mjs';

const runner = fileURLToPath(new URL('../.config/pi/extensions/night-queue.mjs', import.meta.url));
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
 for(const [events,exit] of [[{settled:false},0],[{settled:true,failed:true},0],[{settled:true,blocked:true},0],[{settled:true},1]]) assert.equal(evaluateRun(events,exit).ok,false);
});

test('detached queue invokes /i, creates isolated branch and draft PR', async()=>{
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
console.log(JSON.stringify({type:'agent_settled'}));
`;
 writeFileSync(join(bin,'gh'),fakeGh,{mode:0o755});writeFileSync(join(bin,'pi'),fakePi,{mode:0o755});
 const env={...process.env,PATH:`${bin}:${process.env.PATH}`,MOCK_RECORD:join(temp,'gh-prs.log'),MOCK_PI_RECORD:join(temp,'pi-prompts.log')};
 exec(process.execPath,[runner,'start','0.01'],root,env);
 const stateFile=join(root,'.git','pi-night','state.json');
 let state;
 for(let i=0;i<100;i++){
   await new Promise(r=>setTimeout(r,100));
   if(existsSync(stateFile)) {state=JSON.parse(readFileSync(stateFile,'utf8'));if(state.finishedAt)break;}
 }
 assert.equal(state?.status,'finished',JSON.stringify(state));
 assert.equal(state.issues['10'].status,'pr-created');
 assert.equal(state.issues['11'],undefined);
 const prompts=readFileSync(env.MOCK_PI_RECORD,'utf8');
 assert.match(prompts,/\/i #10 Night queue authorization/);
 assert.doesNotMatch(prompts,/\/i #11/);
 const pr=readFileSync(env.MOCK_RECORD,'utf8');
 assert.match(pr,/--draft/);
 assert.match(exec('git',['branch','--list','agent/night/issue-10'],root),/issue-10/);
});
