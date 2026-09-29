// Start `serve` on the built site (same as `npx serve site`) for verification.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './config.mjs';

export async function startServer(dir, port) {
  const bin = path.join(ROOT, 'node_modules', '.bin', 'serve');
  const child = spawn(bin, [dir, '-l', `tcp://127.0.0.1:${port}`, '--no-clipboard', '--no-port-switching', '--no-request-logging'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
  });
  let output = '';
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`${base}/`, { redirect: 'manual' });
      if (res.status) return { base, stop: () => child.kill() };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  throw new Error(`serve did not start on port ${port}:\n${output}`);
}
