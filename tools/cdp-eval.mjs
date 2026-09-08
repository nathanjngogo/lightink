#!/usr/bin/env node
// Evaluate a JS expression OR a script file's contents in the probe page.
// Usage: node cdp-eval.mjs '<expr>'   |   node cdp-eval.mjs --file path/to/script.js
import http from 'node:http';
import fs from 'node:fs';

let expr = process.argv[2];
if (process.argv[2] === '--file') expr = fs.readFileSync(process.argv[3], 'utf8');
const PORT = Number(process.env.CDP_PORT || 9333);
if (!expr) { console.error('usage: node cdp-eval.mjs "<expr>" | --file <script> [-- port via CDP_PORT]'); process.exit(2); }

function getJSON(path) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}
function wsSend(url, msg) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    ws.onopen = () => ws.send(JSON.stringify(msg));
    ws.onmessage = ev => { res(JSON.parse(ev.data)); ws.close(); };
    ws.onerror = () => rej(new Error('ws error'));
    setTimeout(() => { try { ws.close(); } catch {} rej(new Error('ws timeout')); }, 60000);
  });
}

const targets = await getJSON('/json/list');
const page = targets.find(t => t.type === 'page');
if (!page) { console.error('no page target; targets:', targets.map(t => t.type + ' ' + t.url).join(', ')); process.exit(1); }
const reply = await wsSend(page.webSocketDebuggerUrl, {
  id: 1, method: 'Runtime.evaluate',
  params: { expression: expr, returnByValue: true, awaitPromise: true },
});
if (reply.error) { console.error('CDP error:', JSON.stringify(reply.error)); process.exit(1); }
const r = reply.result;
if (r.exceptionDetails) { console.error('PAGE EXCEPTION:', JSON.stringify(r.exceptionDetails, null, 2).slice(0, 2000)); process.exit(1); }
console.log(JSON.stringify(r.result?.value ?? r.result, null, 2));
process.exit(0);
