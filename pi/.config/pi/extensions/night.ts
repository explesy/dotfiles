// Foreground Pi Night is launched explicitly via pi-night in a terminal.
// This Pi command remains a read-only status / soft-stop interface.
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const runner = join(dirname(fileURLToPath(import.meta.url)), '..', 'night', 'night-queue.mjs');

export default function night(pi: ExtensionAPI) {
  pi.registerCommand('night', {
    description: 'Night queue status/stop; start visible with pi-night [hours] in your terminal',
    handler: async (args, ctx) => {
      const [action = 'help', value, ...rest] = args.trim().split(/\s+/).filter(Boolean);
      if (action === 'start' || action === 'help' || action === 'run') {
        if (rest.length || (value && (action !== 'start' && action !== 'run'))) {
          ctx.ui.notify('Use: pi-night [hours] (terminal); /night status; /night stop', 'warning');
          return;
        }
        const hours = value || '8';
        ctx.ui.notify(`Фоновый запуск отключён. В отдельном терминале проекта запусти: pi-night ${hours} — процесс и инструменты /i будут видны.`, 'info');
        return;
      }
      if (!['status','stop','summary'].includes(action) || value || rest.length) {
        ctx.ui.notify('Use: pi-night [hours] (terminal); /night status; /night summary; /night stop', 'warning');
        return;
      }
      try {
        const { stdout } = await exec(process.execPath, [runner,action], {
          cwd: ctx.cwd, timeout: 15000, maxBuffer: 1024*1024,
        });
        if (action === 'stop') {
          ctx.ui.notify(stdout.trim() || 'Запрос на мягкую остановку отправлен', 'info');
          return;
        }
        if (action === 'summary') {
          ctx.ui.notify(stdout.trim(), 'info');
          return;
        }
        const data = JSON.parse(stdout);
        const entries = Object.entries(data.issues || {}) as [string, {status?:string;lastActivity?:string;url?:string}][];
        const current = entries.filter(([,v]) => v.status === 'running');
        const last = entries.at(-1);
        const summary = current.length
          ? current.map(([n,v]) => `#${n}: ${v.lastActivity || 'выполняется'}`).join('; ')
          : last ? `последняя #${last[0]}: ${last[1].status || 'unknown'}` : 'нет обработанных задач';
        ctx.ui.notify(`Night: ${data.running ? 'работает' : 'не запущен'} · ${data.status || 'нет истории'} · ${summary}`, 'info');
      } catch(e) {
        const error = e as {stderr?:string;message?:string};
        ctx.ui.notify(`Night: ${String(error?.stderr || error?.message || e).slice(0,500)}`, 'error');
      }
    },
  });
}
