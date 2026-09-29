// v1.0.23 验收：新建=常规版心 + 搜索/关闭按钮矩形圆角
(async () => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const R = {};
  // 1) 新建文档
  $('#btnNewDoc').click(); await sleep(400);
  const inp = $('#dlgInput'); if (inp) { inp.value = 'v23test'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  $('#dlgOk').click(); await sleep(1500);
  R.newA4 = $('#editorWrap').classList.contains('a4-paper');
  R.newW = Math.round($('.ProseMirror').getBoundingClientRect().width);
  R.editorBg = getComputedStyle($('#editorWrap')).backgroundColor;
  // 2) 关闭（内存新文档→守卫弹窗），选「关闭/不保存」，再打开已有文件
  $('#btnCloseDoc').click(); await sleep(600);
  const dlg = $('#dlg');
  if (dlg && getComputedStyle(dlg).display !== 'none') {
    const b = [...dlg.querySelectorAll('button')].find(x => /关闭|不保存|丢弃/.test(x.textContent));
    if (b) { b.click(); await sleep(700); }
  }
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/tools/v23-final.md'); await sleep(1800);
  R.oldA4 = $('#editorWrap').classList.contains('a4-paper');
  R.oldW = Math.round($('.ProseMirror').getBoundingClientRect().width);
  R.widthSame = R.newW === R.oldW;
  // 3) 圆角实测
  R.searchRadius = getComputedStyle($('#btnPalette')).borderRadius;
  R.closeRadius = getComputedStyle($('#btnCloseDoc')).borderRadius;
  R.errors = (window.__errors || []).length;
  return R;
})()
