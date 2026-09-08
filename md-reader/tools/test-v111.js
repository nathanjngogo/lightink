(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // ===== 1. 新建弹窗：只有命名（无保存地址行）=====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,300));
  out.newTitle = $('#dlgTitle').textContent;             // 期望「新建文档」
  out.newHasDirRow = !$('#dlgDirRow').hidden;            // 期望 false（隐藏）
  out.newInput = $('#dlgInput').value;
  // 完成新建
  $('#dlgInput').value = 'v111测试.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1400));
  // ===== 2. 关闭弹窗：显示完整保存路径，默认文档目录 =====
  out.docsDir = window.__docsDir;                        // 期望 C:\Users\1\Documents
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, '内容');
  await new Promise(r=>setTimeout(r,1000));
  $('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,400));
  out.closeTitle = $('#dlgTitle').textContent;
  out.dirRowVisible = !$('#dlgDirRow').hidden;
  out.dirText = $('#dlgDir').textContent;                // 期望完整路径
  out.dirIsFullPath = $('#dlgDir').textContent.includes('\\') || $('#dlgDir').textContent.includes('/');
  out.dirPickBtn = !!$('#dlgDirPick');
  // 取消并放弃，清理
  $('#dlgDiscard').click();
  await new Promise(r=>setTimeout(r,400));
  out.backHome = !document.body.hasAttribute('data-doc-open');
  out.errs = window.__errors;
  return out;
})()
