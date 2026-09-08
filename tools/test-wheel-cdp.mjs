// CDP Input.dispatchMouseEvent('mouseWheel') —— 可信输入路径，等价真实滚轮
import http from 'node:http';
import fs from 'node:fs';

const port = Number(process.env.CDP_PORT || 9361);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p }, r => {
    let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b)));
  }).on('error', rej);
});
const targets = await getJSON('/json/list');
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise(res => { const m = ++id; pending.set(m, res); ws.send(JSON.stringify({ id: m, method, params })); });
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise(r => { ws.onopen = r; });

const evalJS = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

// 打开文档
await evalJS(`window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md')`);
await new Promise(r => setTimeout(r, 2200));

const before = await evalJS(`document.querySelector('#editorPane').scrollTop`);
// 真实滚轮：5 格向下
for (let i = 0; i < 5; i++) {
  await send('Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: Math.round(1280 * 0.6), y: Math.round(840 * 0.5),
    deltaX: 0, deltaY: 240,
  });
  await new Promise(r => setTimeout(r, 120));
}
await new Promise(r => setTimeout(r, 400));
const after = await evalJS(`document.querySelector('#editorPane').scrollTop`);
const hit = await evalJS(`(() => { const e = document.elementFromPoint(Math.round(innerWidth*0.6), Math.round(innerHeight*0.5)); return e ? (e.id || e.tagName) : 'none'; })()`);

console.log(JSON.stringify({ scrollTopBefore: before, scrollTopAfter: after, wheelWorked: after > before, hitTop: hit }));
process.exit(0);
