(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // ===== 1. 新建弹窗：只保留文件命名（无地址行）=====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,300));
  out.newDlg = {
    title: $('#dlgTitle').textContent,
    hasInput: !$('#dlgInput').hidden,
    hasDirRow: !$('#dlgDirRow').hidden,   // 期望 false（隐藏）
  };
  $('#dlgCancel').click();
  await new Promise(r=>setTimeout(r,200));
  // ===== 2. 新建文档 → 关闭 → 退出弹窗显示完整文档目录路径 =====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,300));
  $('#dlgInput').value = '路径测试.md';
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
  const dirInput = $('#dlgDir');
  out.quitDlg = {
    shown: $('#dlg').classList.contains('show'),
    isInput: dirInput.tagName === 'INPUT',
    dirValue: dirInput.value,                        // 期望 C:\Users\1\Documents
    fullWinPath: /^[A-Za-z]:\\/.test(dirInput.value) || dirInput.value.startsWith('C:/'),
    hasPickBtn: !!$('#dlgDirPick'),
    threeBtns: { cancel: !!$('#dlgCancel'), discard: !!$('#dlgDiscard'), save: !!$('#dlgOk') },
  };
  // ===== 3. 手动改路径（模拟输入）→ 保存 → 文件落到新路径 =====
  const customDir = 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/testsave';
  dirInput.value = customDir;
  dirInput.dispatchEvent(new Event('input'));
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,800));
  out.savedToCustom = await window.mdr.fileExists(customDir + '/路径测试.md');
  out.backHomeAfterSave = !document.body.hasAttribute('data-doc-open');
  // 清理测试文件交给外部 python（桥无删除 API）
  out.errs = window.__errors;
  return out;
})()
