// Real-time smoke test over the Chrome DevTools Protocol: open a URL, wait, collect console errors and page state.
// usage: node cdp-probe.mjs <url> <waitMs> [--reduced] [--eval=<JS expression>] [--shot=<png path>]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, waitMs = '20000', ...flags] = process.argv.slice(2);
const flag = flags.includes('--reduced') ? '--reduced' : null;
const extra = flags.find((f) => f.startsWith('--eval='))?.slice(7);
const shot = flags.find((f) => f.startsWith('--shot='))?.slice(7);
const profile = mkdtempSync(join(tmpdir(), 'cdp-'));
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--window-size=500,900', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50 && !targets; i++) {
  await sleep(200);
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {}
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(`${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable');
await send('Log.enable');
if (flag === '--reduced') await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.navigate', { url });
await sleep(Number(waitMs));
const expr = `(() => { const $ = (i) => document.getElementById(i); const app = $('app');
  return { screen: app.dataset.screen, theme: document.documentElement.dataset.theme, score: $('score').textContent, rank: $('r-rank')?.textContent,
    percent: $('r-percent')?.textContent, combo: $('r-combo')?.textContent, bars: ['r-score-bar','r-combo-bar','r-fever-bar','r-favorite-bar'].map((b) => $(b)?.style.getPropertyValue('--w')).join(','),
    hudBangAnim: getComputedStyle(document.querySelector('.hud-bangs i')).animationName, startHintAnim: getComputedStyle($('start-hint')).animationName,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }; })()`;
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(JSON.stringify(res.result.value));
if (extra) {
  const more = await send('Runtime.evaluate', { expression: extra, returnByValue: true });
  console.log('eval:', JSON.stringify(more.result.value ?? more.result.description));
}
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors: none');
if (shot) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  (await import('node:fs')).writeFileSync(shot, Buffer.from(data, 'base64'));
  console.log('shot:', shot);
}
ws.close();
chrome.kill();
await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
