// v1.0.13 验证：复现用户场景（先触发一次带地址行的关闭弹窗 → 再新建 → 弹窗应无地址行）
(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 步骤1：新建文档并编辑（制造脏状态）
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,300));
  $('#dlgInput').value = '复现测试.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  const pm = document.querySelector('.ProseMirror');
  const p1 = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p1); rg.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, 'X');
  await new Promise(r=>setTimeout(r,1000));
  // 步骤2：关闭 → 三按钮+地址行出现（正常）→ 取消
  $('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,400));
  out.quitDlgHasDirRow = !$('#dlgDirRow').hidden;
  $('#dlgCancel').click();
  await new Promise(r=>setTimeout(r,300));
  // 步骤3：直接新建 → askText 弹窗【必须无地址行、两按钮】
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,400));
  out.newDlg = {
    title: $('#dlgTitle').textContent,
    dirRowHidden: $('#dlgDirRow').hidden,          // 期望 true（用户核心诉求）
    btnCount: $('#dlgBtns').querySelectorAll('button').length,  // 期望 2
    btnIds: [...$('#dlgBtns').querySelectorAll('button')].map(b=>b.id),
    inputVisible: !$('#dlgInput').hidden,
  };
  // 步骤4：新建弹窗确定可用（复位后按钮绑定正常）
  $('#dlgInput').value = '复位后新建.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  out.createdAfterReset = $('#docTitleText').textContent.includes('复位后新建');
  // 步骤5：关闭它（脏）→ 地址行仍在（退出时提供保存路径）→ 取消放弃
  const pm2 = document.querySelector('.ProseMirror');
  const p2 = pm2.querySelector('p') || pm2.querySelector('h1');
  const rg2 = document.createRange(); rg2.selectNodeContents(p2); rg2.collapse(false);
  const sel2 = getSelection(); sel2.removeAllRanges(); sel2.addRange(rg2);
  document.execCommand('insertText', false, 'Y');
  await new Promise(r=>setTimeout(r,1000));
  $('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,400));
  out.quitStillHasDirRow = !$('#dlgDirRow').hidden;
  out.quitDirValue = $('#dlgDir').value;
  $('#dlgDiscard').click();
  await new Promise(r=>setTimeout(r,400));
  out.discardOk = !document.body.hasAttribute('data-doc-open');
  out.errs = window.__errors;
  return out;
})()
