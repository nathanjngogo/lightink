(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 完整守卫链路：新建 → 编辑 → 点关闭 → 对话框应弹出 → 命名保存
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  $('#dlgInput').value = 'final-guard.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
  document.execCommand('insertText', false, 'final check');
  await new Promise(r=>setTimeout(r,1100));
  out.modified = $('#docTitle').classList.contains('modified');
  $('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,300));
  out.dlgShown = $('#dlg').classList.contains('show');
  if (out.dlgShown) {
    $('#dlgInput').value = 'final-guard-saved.md';
    $('#dlgOk').click();
    await new Promise(r=>setTimeout(r,700));
    out.saved = await window.mdr.fileExists('C:/Users/1/Documents/final-guard-saved.md');
  }
  out.back = !document.body.hasAttribute('data-doc-open');
  // 书架对话框也复验一遍（新建文件夹）
  document.querySelectorAll('.shelf-bar .shelf-btn')[0].click();
  await new Promise(r=>setTimeout(r,250));
  $('#dlgInput').value = '最终验证文件夹';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,400));
  const data = await window.mdr.shelfData();
  out.shelfFolderCreated = data.folders.some(f => f.name === '最终验证文件夹');
  // 清理：删掉验证文件夹
  const fid = data.folders.find(f => f.name === '最终验证文件夹').id;
  await window.mdr.shelfFolderRemove(fid);
  out.errs = window.__errors;
  return out;
})()
