// Capture screenshots of ui-v1 via CDP Page.captureScreenshot
// Usage: CDP_PORT=9335 node shot.mjs <name-without-ext> <setup-js-or-empty> [settleMs]
import http from 'node:http';
import fs from 'node:fs';

const port = Number(process.env.CDP_PORT || 9333);
const name = process.argv[2];
const setup = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf8') : '';
const settle = Number(process.argv[4] || 900);

const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p }, r => {
    let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b)));
  }).on('error', rej);
});

const targets = await getJSON('/json/list');
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res) => {
  const mid = ++id;
  pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
await new Promise(r => { ws.onopen = r; });

await send('Page.enable');
if (setup) await send('Runtime.evaluate', { expression: setup, awaitPromise: true });
await new Promise(r => setTimeout(r, settle));
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(`${name}.png`, Buffer.from(shot.result.data, 'base64'));
console.log(`saved ${name}.png`);
process.exit(0);
