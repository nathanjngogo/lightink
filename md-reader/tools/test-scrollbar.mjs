// 滚动条拖拽 + 源码模式回归
import http from 'node:http';
const port = Number(process.env.CDP_PORT || 9361);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b))); }).on('error', rej);
});
const targets = await getJSON('/json/list');
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise(res => { const m = ++id; pending.set(m, res); ws.send(JSON.stringify({ id: m, method, params })); });
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise(r => { ws.onopen = r; });
const evalJS = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

const out = {};
// 滚动条几何：滑块位置（右缘）
const geo = await evalJS(`(() => {
  const pane = document.querySelector('#editorPane');
  const r = pane.getBoundingClientRect();
  return { paneRight: Math.round(r.right), scrollbarX: Math.round(r.right - 12), innerW: innerWidth, innerH: innerHeight };
})()`);
out.geo = geo;
// 在滚动条区域按下-拖动-松开
const startY = 200;
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: geo.scrollbarX, y: startY, button: 'left', clickCount: 1 });
await new Promise(r => setTimeout(r, 100));
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: geo.scrollbarX, y: startY + 300 });
await new Promise(r => setTimeout(r, 100));
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: geo.scrollbarX, y: startY + 300, button: 'left' });
await new Promise(r => setTimeout(r, 300));
out.scrollTopAfterDrag = await evalJS(`document.querySelector('#editorPane').scrollTop`);
out.dragWorked = out.scrollTopAfterDrag > 500;

// 源码模式回归：切源码 → textarea 可见可聚焦 → 切回编辑 → 滚轮仍正常
await evalJS(`document.querySelector('[data-m="source"]').click()`);
await new Promise(r => setTimeout(r, 300));
out.srcVis = await evalJS(`getComputedStyle(document.querySelector('#sourcePane')).visibility`);
await evalJS(`document.querySelector('#source').focus()`);
out.srcFocused = await evalJS(`document.activeElement === document.querySelector('#source')`);
await evalJS(`document.querySelector('[data-m="edit"]').click()`);
await new Promise(r => setTimeout(r, 600));
const b2 = await evalJS(`document.querySelector('#editorPane').scrollTop`);
for (let i = 0; i < 3; i++) {
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(1280 * 0.6), y: Math.round(840 * 0.5), deltaX: 0, deltaY: 240 });
  await new Promise(r => setTimeout(r, 100));
}
await new Promise(r => setTimeout(r, 300));
const a2 = await evalJS(`document.querySelector('#editorPane').scrollTop`);
out.wheelAfterModeCycle = a2 > b2;

out.errs = await evalJS(`window.__errors.length`);
console.log(JSON.stringify(out, null, 2));
process.exit(0);
