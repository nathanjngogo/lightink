(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  window.__res = {};
  const P = 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md';

  /* 1. 书架持久化 */
  await window.mdr.setShelf('C:/Users/1/Documents/ChatGPT/软件开发/md-reader');
  out.shelfPersisted = (await window.mdr.getShelf()) === 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader';
  out.shelfInDom = document.querySelectorAll('#realFiles .tree-item').length >= 2;

  /* 2. 清掉旧位置 → 打开 → 等 2s → 滚动 → 保存 */
  await window.mdr.readingSet(P, null);
  await window.__openPath(P);
  await new Promise(r => setTimeout(r, 2000));
  const pane = $('#editorPane');
  const max = pane.scrollHeight - pane.clientHeight;
  pane.scrollTop = max * 0.6;
  await new Promise(r => setTimeout(r, 900));
  const saved = (await window.mdr.readingAll())[P];
  out.saved = saved;
  out.savedOk = saved != null && Math.abs(saved - 0.6) < 0.05;

  /* 3. 关闭 → 重开 → 等 2.2s（双阶段恢复 900ms + 余量）→ 校验 */
  document.body.removeAttribute('data-doc-open');
  await new Promise(r => setTimeout(r, 300));
  await window.__openPath(P);
  await new Promise(r => setTimeout(r, 2200));
  const restored = pane.scrollTop / (pane.scrollHeight - pane.clientHeight);
  out.restored = restored;
  out.restoreOk = Math.abs(saved - restored) < 0.05;

  /* 4. 导出 HTML 管线 */
  const html = await window.__buildExportHtml();
  out.htmlSize = html.length;
  out.htmlSelfContained = html.includes('data:font/woff2');
  out.htmlNoCm = !html.includes('cm-editor');
  out.htmlHasCode = html.includes('printf');
  out.htmlHasKatex = html.includes('katex');
  out.htmlHasH1 = html.includes('<h1');

  /* 5. Ctrl+F（Highlight API） */
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 300));
  const fi = $('#findInput');
  fi.value = '里程碑';
  fi.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 500));
  out.findCount = $('#findCount').textContent;
  out.highlightOn = CSS.highlights.has('mdr-search');
  fi.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 300));
  out.afterEnter = $('#findCount').textContent;
  fi.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 250));
  out.findClosed = !$('#findbar').classList.contains('show');
  out.highlightCleared = !CSS.highlights.has('mdr-search');

  out.errs = window.__errors;
  return out;
})()
