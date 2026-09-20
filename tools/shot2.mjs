// 截图：先 Page.bringToFront 再抓（规避遮挡导致的 capture 挂起）
// 用法：CDP_PORT=xxxx node shot2.mjs <name> [settleMs]
import http from 'node:http';
import fs from 'node:fs';

const port = Number(process.env.CDP_PORT || 9333);
const name = process.argv[2] || 'shot';
const settle = Number(process.argv[3] || 1200);

const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b))); }).on('error', rej);
});

const targets = await getJSON('/json/list');
const page = targets.find(t => t.type === 'page');
if (!page) { console.log('NO_PAGE'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise(res => { const m = ++id; pending.set(m, res); ws.send(JSON.stringify({ id: m, method, params })); });
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise((r, j) => { ws.onopen = r; setTimeout(() => j(new Error('ws open timeout')), 5000); });

await send('Page.enable');
await send('Page.bringToFront');
await new Promise(r => setTimeout(r, settle));
const shot = await Promise.race([
  send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }),
  new Promise((_, j) => setTimeout(() => j(new Error('capture timeout')), 15000)),
]);
if (!shot.result || !shot.result.data) { console.log('SHOT_FAIL', JSON.stringify(shot).slice(0, 200)); process.exit(1); }
fs.writeFileSync(`${name}.png`, Buffer.from(shot.result.data, 'base64'));
console.log(`saved ${name}.png`);
process.exit(0);