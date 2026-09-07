(async () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const out = {};
  // ===== 1. 新建文档 → 关闭 → 三选项对话框 =====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  $('#dlgInput').value = 'v105-三选项.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1200));
  out.newDocOpen = $('#docTitleText').textContent.includes('v105-三选项');
  // 编辑触发脏标记
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, 'V105 内容');
  await new Promise(r=>setTimeout(r,1000));
  out.dirty = $('#docTitle').classList.contains('modified');
  // 关闭 → 对话框应有三按钮
  $('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,300));
  out.dlgShown = $('#dlg').classList.contains('show');
  out.hasThreeBtns = { cancel: !!$('#dlgCancel'), discard: !!$('#dlgDiscard'), save: !!$('#dlgOk') };
  out.hasDirRow = !$('#dlgDirRow').hidden;
  out.defaultDir = $('#dlgDir').textContent;
  out.defaultName = $('#dlgInput').value;
  // 选保存地址（目录对话框不能自动化，验证 dirPick 按钮存在且可点不报错）
  out.dirPickBtn = !!$('#dlgDirPick');
  // 点「不保存」→ 应回主页且不落盘
  $('#dlgDiscard').click();
  await new Promise(r=>setTimeout(r,500));
  out.discardBackHome = !document.body.hasAttribute('data-doc-open');
  out.discardFileNotCreated = !(await window.mdr.fileExists('C:/Users/1/Documents/v105-三选项.md'));
  // ===== 2. 再走一遍选「保存」+ 自定义名 =====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  $('#dlgInput').value = 'v105-保存流程.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1200));
  const pm2 = document.querySelector('.ProseMirror');
  const p2 = pm2.querySelector('p') || pm2.querySelector('h1');
  const rg2 = document.createRange(); rg2.selectNodeContents(p2); rg2.collapse(false);
  const sel2 = getSelection(); sel2.removeAllRanges(); sel2.addRange(rg2);
  document.execCommand('insertText', false, '保存验证');
  await new Promise(r=>setTimeout(r,900));
  $('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,300));
  $('#dlgInput').value = 'v105-保存成功.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,700));
  out.savedBackHome = !document.body.hasAttribute('data-doc-open');
  out.savedExists = await window.mdr.fileExists('C:/Users/1/Documents/v105-保存成功.md');
  // ===== 3. 书架旧示例条目已消失 =====
  await window.__renderShelfData();
  await new Promise(r=>setTimeout(r,400));
  out.shelfText = document.querySelector('#realFiles').textContent.replace(/\s+/g,' ').slice(0,60);
  out.noLegacyShelf = !document.querySelector('#realFiles').textContent.includes('会议笔记.md');
  out.errs = window.__errors;
  return out;
})()
