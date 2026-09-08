// 截图（Page.captureScreenshot）——独立脚本，快速失败
import http from 'node:http';
import fs from 'node:fs';

const port = Number(process.env.CDP_PORT || 9376);
const name = process.argv[2] || 'shot';
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p }, r => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res(JSON.parse(b))); }).on('error', rej);
});
const t0 = Date.now();
try {
  const targets = await getJSON('/json/list');
  const page = targets.find(t => t.type === 'page');
  if (!page) { console.log('NO_PAGE'); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise(res => { const m = ++id; pending.set(m, res); ws.send(JSON.stringify({ id: m, method, params })); });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await new Promise((r, j) => { ws.onopen = r; setTimeout(() => j(new Error('ws open timeout')), 4000); });
  const shot = await Promise.race([
    send('Page.captureScreenshot', { format: 'png' }),
    new Promise((_, j) => setTimeout(() => j(new Error('capture timeout')), 8000)),
  ]);
  fs.writeFileSync(`${name}.png`, Buffer.from(shot.result.data, 'base64'));
  console.log(`saved ${name}.png in ${Date.now() - t0}ms`);
  process.exit(0);
} catch (e) {
  console.log('SHOT_FAIL', e.message);
  process.exit(1);
}
