// Installed Pi loader/command tests. No inference, external writes or project work.
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const agentDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), '.config/pi');
const { loadExtensions } = await import(pathToFileURL(join(agentDir,
  'npm/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/loader.js')));
const source = fileURLToPath(new URL('../.config/pi/extensions/workflow.ts', import.meta.url));
const cwd = fileURLToPath(new URL('../../', import.meta.url));
async function run(args, {command='i', unavailable=false, auth=false}={}) {
  const loaded = await loadExtensions([source], cwd);
  assert.deepEqual(loaded.errors, []);
  const models=[], levels=[], messages=[], notices=[], statuses=[];
  loaded.runtime.setModel=async model=>{models.push([model.provider,model.id]);return !auth;};
  loaded.runtime.setThinkingLevel=level=>levels.push(level);
  loaded.runtime.sendUserMessage=message=>messages.push(message);
  await loaded.extensions[0].commands.get(command).handler(args, {
    modelRegistry:{find:(provider,id)=>unavailable?undefined:{provider,id,name:id}},
    ui:{notify:(...value)=>notices.push(value),setStatus:(...value)=>statuses.push(value)},
  });
  return {models,levels,messages,notices,statuses};
}
const expected={ds:['opencode-go','deepseek-v4.1-flash','high'],codex:['openai-codex','gpt-6.1-sol','medium'],luna:['openai-codex','gpt-6-luna','high'],agy:['antigravity','gemini-3-8-flash','low']};
let cases=0;
for(const [args,key] of [['37','ds'],['#37','ds'],['ds 37','ds'],['codex #37','codex'],['luna 37','luna'],['agy 37','agy']]) {
  const r=await run(args);assert.deepEqual(r.models,[expected[key].slice(0,2)]);assert.deepEqual(r.levels,[expected[key][2]]);
  assert.equal(r.messages.length,1);assert.match(r.messages[0],/Execute GitHub issue #37/);cases++;
}
for(const task of ['исправь сортировку','подготовь документ','codex исправь текст','luna объясни алгоритм','constructor 37','toString 37','__proto__ 37','проверь CSS\nбез изменения логики','# Заголовок\nНапиши заметку']) {
  const r=await run(task);assert.equal(r.messages.length,1);assert.ok(r.messages[0].includes(`Execute this original user task:\n\n${task}`));assert.deepEqual(r.models,[expected.ds.slice(0,2)]);cases++;
}
const empty=await run('');assert.match(empty.messages[0],/already agreed in this conversation/);assert.match(empty.messages[0],/do not choose a task or queue automatically/);cases++;
const extra=await run('#37 дополнительное требование\nвторая строка');assert.ok(extra.messages[0].includes('Additional user requirement:\nдополнительное требование\nвторая строка'));cases++;
for(const args of ['0','#0','999999999999999999999','#bad','ds 0']) {
  const r=await run(args);assert.equal(r.models.length,0);assert.equal(r.messages.length,0);assert.equal(r.notices.length,1);cases++;
}
for(const args of ['--next','--next сначала проверь blockers','codex --next']) {
  const r=await run(args);assert.match(r.messages[0],/existing GitHub execution/);assert.match(r.messages[0],/do not invent priorities/);cases++;
}
const n=await run('codex ограничения',{command:'n'});const i=await run('codex --next ограничения');assert.deepEqual(n.models,i.models);assert.deepEqual(n.levels,i.levels);assert.deepEqual(n.messages,i.messages);cases++;
for(const options of [{unavailable:true},{auth:true}]) {
  const r=await run('исправь ошибку',options);assert.equal(r.messages.length,0);assert.equal(r.levels.length,0);assert.equal(r.statuses.length,0);assert.equal(r.notices.length,1);cases++;
}
console.log(JSON.stringify({passed:cases,loaderErrors:0,method:'installed Pi loader and mocked command/model delivery; no inference'},null,2));
