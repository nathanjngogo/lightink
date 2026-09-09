// v1.0.17 验证：阅读优先/保持编辑 开关
(async () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const out = {};
  const modeNow = () => document.body.dataset.mode;
  // ===== A. 默认（阅读优先）：开 doc1 → 编辑 → 切 doc2 → 应回 read =====
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/test-doc.md');
  await new Promise(r=>setTimeout(r,1200));
  out.A1_open1 = modeNow();
  $$('#modeSeg button').find(b=>b.dataset.m==='edit').click();
  await new Promise(r=>setTimeout(r,500));
  out.A2_edit1 = modeNow();
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/docs/使用说明书.md');
  await new Promise(r=>setTimeout(r,1500));
  out.A3_open2_read = modeNow();               // 期望 read
  // ===== B. 打开开关（保持编辑）→ 编辑 doc2 → 切 doc1 → 应保持 edit =====
  $('#btnKeepMode').click();
  await new Promise(r=>setTimeout(r,200));
  out.B1_switchOn = $('#btnKeepMode').getAttribute('aria-checked');
  out.B1_label = $('#keepModeLabel').textContent;
  $$('#modeSeg button').find(b=>b.dataset.m==='edit').click();
  await new Promise(r=>setTimeout(r,500));
  out.B2_edit2 = modeNow();
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/test-doc.md');
  await new Promise(r=>setTimeout(r,1500));
  out.B3_open1_keepEdit = modeNow();           // 期望 edit
  // ===== C. 保持编辑下用源码模式切换 → 应保持 source =====
  $$('#modeSeg button').find(b=>b.dataset.m==='source').click();
  await new Promise(r=>setTimeout(r,500));
  out.C1_source = modeNow();
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/docs/使用说明书.md');
  await new Promise(r=>setTimeout(r,1500));
  out.C2_open2_keepSource = modeNow();         // 期望 source
  out.C2_readonlyOff = document.querySelector('.ProseMirror')?.getAttribute('contenteditable') === 'true';
  // ===== D. 关闭开关 → 切换文档回 read；开关状态持久化 =====
  $('#btnKeepMode').click();
  await new Promise(r=>setTimeout(r,200));
  out.D1_switchOff = $('#btnKeepMode').getAttribute('aria-checked');
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/test-doc.md');
  await new Promise(r=>setTimeout(r,1500));
  out.D2_backToRead = modeNow();               // 期望 read
  out.D3_persisted = localStorage.getItem('mdr:keepMode');
  out.errs = window.__errors.length;
  return out;
})()
