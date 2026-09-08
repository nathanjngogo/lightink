// v1.0.14 验证：这次必须验证【视觉实际渲染】，不只属性
(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  const vis = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && el.offsetParent !== null; };
  // ===== 1. 冷启动直接新建（用户场景）=====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,400));
  const row = $('#dlgDirRow');
  out.newDlg = {
    hiddenAttr: row.hidden,
    visuallyVisible: vis(row),                 // 期望 false —— 关键断言
    offsetHeight: row.offsetHeight,            // 期望 0
    title: $('#dlgTitle').textContent,
    btnCount: $('#dlgBtns').querySelectorAll('button').length,
  };
  $('#dlgCancel').click();
  await new Promise(r=>setTimeout(r,250));
  // ===== 2. 三按钮弹窗后地址行必须可见（退出场景不能被弄坏）=====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,300));
  $('#dlgInput').value = '退出验证.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  const pm = document.querySelector('.ProseMirror');
  const p1 = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p1); rg.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, 'X');
  await new Promise(r=>setTimeout(r,1000));
  $('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,400));
  out.quitDlg = { dirRowVisible: vis(row), dirValue: $('#dlgDir').value };  // 期望 visible=true
  $('#dlgDiscard').click();
  await new Promise(r=>setTimeout(r,400));
  // ===== 3. 关闭后再新建 → 地址行必须重新消失 =====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,400));
  out.newAfterQuit = { hiddenAttr: row.hidden, visuallyVisible: vis(row) };  // 期望 false/false
  $('#dlgCancel').click();
  await new Promise(r=>setTimeout(r,200));
  // ===== 4. 其他 hidden 元素未被误伤：btnCloseDoc / btnExport =====
  out.btnCloseDocHiddenOk = !vis($('#btnCloseDoc'));   // 未开文档时应隐藏
  out.errs = window.__errors;
  return out;
})()
