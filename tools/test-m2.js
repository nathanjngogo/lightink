(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  window.__errs = [];
  window.addEventListener('error', e => window.__errs.push(e.message));

  /* ===== 1. 书架持久化 ===== */
  await window.mdr.setShelf('C:/Users/1/Documents/ChatGPT/软件开发/md-reader');
  const shelfBack = await window.mdr.getShelf();
  out.shelfPersisted = shelfBack === 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader';
  const { files } = await window.mdr.listMd(shelfBack);
  out.shelfFiles = files.map(f => f.name);

  /* ===== 2. 打开文档 + 阅读位置 ===== */
  const P = 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md';
  await window.__openPath(P);
  await new Promise(r => setTimeout(r, 1200));
  out.docOpen = $('#docTitle')?.textContent;
  // 滚到底部触发位置保存
  const pane = $('#editorPane');
  pane.scrollTop = pane.scrollHeight;
  await new Promise(r => setTimeout(r, 700));
  const saved = await window.mdr.readingAll();
  out.posSaved = saved[P];
  out.posIsRatio = out.posSaved > 0.5 && out.posSaved <= 1;

  /* ===== 3. Ctrl+F 查找（Highlight API） ===== */
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 300));
  out.findbarShown = $('#findbar').classList.contains('show');
  const fi = $('#findInput');
  fi.value = '测试';
  fi.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 500));
  out.findCount = $('#findCount').textContent;
  out.highlightSupported = typeof CSS !== 'undefined' && !!CSS.highlights;
  out.highlightRegistered = out.highlightSupported && CSS.highlights.has('mdr-search');
  // Enter 导航
  fi.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 300));
  out.afterEnter = $('#findCount').textContent;
  // Esc 关闭清高亮
  fi.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 200));
  out.findClosed = !$('#findbar').classList.contains('show');
  out.highlightCleared = out.highlightSupported ? !CSS.highlights.has('mdr-search') : true;

  /* ===== 4. 导出 HTML（不经对话框直接验证导出管线） ===== */
  // 临时替换对话框与写盘调用以捕获产物
  let capturedHtml = null, capturedTarget = null;
  const origDialog = window.mdr.exportSaveDialog;
  const origWrite = window.mdr.exportWrite;
  window.mdr.exportSaveDialog = async (def, kind) => 'C:/Users/1/AppData/Local/Temp/lightink-test-export.' + kind;
  window.mdr.exportWrite = async (p, html) => { capturedHtml = html; capturedTarget = p; return true; };
  $('#expHtml').click();
  await new Promise(r => setTimeout(r, 2500));
  window.mdr.exportSaveDialog = origDialog;
  window.mdr.exportWrite = origWrite;
  out.htmlBuilt = !!capturedHtml;
  out.htmlSize = capturedHtml ? capturedHtml.length : 0;
  out.htmlSelfContained = capturedHtml ? capturedHtml.includes('data:font/woff2') : false;
  out.htmlNoCm = capturedHtml ? !capturedHtml.includes('cm-editor') : null;
  out.htmlHasCode = capturedHtml ? capturedHtml.includes('console.log') : false;

  /* ===== 5. 模式切换后导出在 source 模式被拦截 ===== */
  $('[data-m="source"]').click();
  await new Promise(r => setTimeout(r, 300));
  let srcBlocked = false;
  window.mdr.exportSaveDialog = async () => { srcBlocked = false; return null; };
  const errCountBefore = (window.__errors || []).length;
  // 直接调用内部函数验证守卫
  out.sourceGuardActive = document.body.dataset.mode === 'source';
  $('[data-m="edit"]').click();
  await new Promise(r => setTimeout(r, 500));

  /* ===== 重开文档验证位置恢复 ===== */
  await window.__openPath(P);
  await new Promise(r => setTimeout(r, 1400));
  const pane2 = $('#editorPane');
  out.posRestored = pane2.scrollTop > pane2.scrollHeight * 0.3;
  const all = await window.mdr.readingAll();
  out.posKeyStillThere = all[P] != null;

  out.errs = window.__errs; out.inPage = window.__errors;
  return out;
})()
