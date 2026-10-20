// /night is a thin control surface. night-queue.mjs launches the existing /i command.
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const runner = join(dirname(fileURLToPath(import.meta.url)), 'night-queue.mjs');

export default function night(pi: ExtensionAPI) {
  pi.registerCommand('night', {
    description: 'Autonomous labeled GitHub issue queue: /night start [hours], status, stop',
    handler: async (args, ctx) => {
      const [action='status', value, ...rest] = args.trim().split(/\s+/).filter(Boolean);
      if (!['start','status','stop'].includes(action) || rest.length || (action !== 'start' && value)) {
        ctx.ui.notify('Usage: /night start [hours=8] | /night status | /night stop', 'warning');
        return;
      }
      try {
        const {stdout} = await exec(process.execPath, [runner,action,...(value ? [value] : [])], {
          cwd:process.cwd(), timeout:15000, maxBuffer:1024*1024,
        });
        ctx.ui.notify(stdout.trim() || `Night: ${action}`, 'info');
      } catch(e) { const error = e as {stderr?:string; message?:string}; ctx.ui.notify(`Night: ${String(error?.stderr || error?.message || e).slice(0,500)}`, 'error'); }
    },
  });
}
