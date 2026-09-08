(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 1) 启动（欢迎页）：退出按钮应隐藏
  out.welcomeBtnHidden = $('#btnCloseDoc').hidden;
  // 2) 打开文档：退出按钮出现在文件名左侧
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r => setTimeout(r, 1500));
  const btn = $('#btnCloseDoc');
  out.docBtnVisible = !btn.hidden;
  const br = btn.getBoundingClientRect();
  const tr = $('#docTitle').getBoundingClientRect();
  out.btnGeom = { x: Math.round(br.x), y: Math.round(br.y), w: Math.round(br.width), h: Math.round(br.height) };
  out.btnNearTitle = br.x > tr.x && br.right < tr.right;
  out.titleText = $('#docTitleText').textContent;
  // 按钮不与窗口关闭钮重叠
  const wc = document.querySelector('.win-controls').getBoundingClientRect();
  out.noOverlapWithWinClose = br.right < wc.x;
  // 3) 点击退出 → 回欢迎页、按钮隐藏
  btn.click();
  await new Promise(r => setTimeout(r, 300));
  out.backToWelcome = !document.body.hasAttribute('data-doc-open');
  out.btnHiddenAgain = $('#btnCloseDoc').hidden;
  out.outlineCleared = document.querySelector('#outlinePane').textContent.includes('打开文档后');
  // 4) 再开文档 → 按钮再现，大纲正常
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md');
  await new Promise(r => setTimeout(r, 1500));
  out.reappear = !$('#btnCloseDoc').hidden;
  out.outlineOk = document.querySelectorAll('#outlinePane .ol-item').length > 0;
  out.dragRegionOk = getComputedStyle($('#btnCloseDoc')).webkitAppRegion !== 'drag';
  out.errs = window.__errors;
  return out;
})()
