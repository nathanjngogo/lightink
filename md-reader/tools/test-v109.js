(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 切深色主题（显式）
  document.querySelector('#themeSeg button[data-th="dark"]')?.click();
  if (!document.documentElement.dataset.theme) {
    // 兜底：直接设
    document.documentElement.dataset.theme = 'dark';
  }
  await new Promise(r=>setTimeout(r,300));
  out.theme = document.documentElement.dataset.theme;
  // 新建文档 → A4 纸面
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  $('#dlgInput').value = '深色a4.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  const wrap = $('#editorWrap');
  const cs = getComputedStyle(wrap);
  out.darkA4bg = cs.backgroundColor;        // 期望 rgb(32,35,36) = #202324
  out.darkA4ink = cs.color;                 // 期望 #d8dad6 = rgb(216,218,214)
  const paneBg = getComputedStyle($('#editorPane')).backgroundColor; // --edit-bg
  out.editorPaneBg = paneBg;
  out.paperMatchesEditMode = cs.backgroundColor === paneBg;
  // 阴影与边框
  out.border = cs.borderColor;
  // 切回浅色 → 纸面应恢复白
  document.querySelector('#themeSeg button[data-th="light"]')?.click();
  await new Promise(r=>setTimeout(r,300));
  out.lightA4bg = getComputedStyle(wrap).backgroundColor;  // 期望 rgb(255,255,255)
  // 再切深色确认往返
  document.querySelector('#themeSeg button[data-th="dark"]')?.click();
  await new Promise(r=>setTimeout(r,300));
  out.darkAgain = getComputedStyle(wrap).backgroundColor;
  out.errs = window.__errors;
  return out;
})()
