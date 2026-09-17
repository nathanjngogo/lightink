// 补充验证：默认配置（自动保存开启）下的切换行为
(async () => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  const fA = 'C:/Users/1/Documents/ChatGPT/软件开发/tools/test-switch-a.md';
  const fB = 'C:/Users/1/Documents/ChatGPT/软件开发/tools/test-switch-b.md';

  // 清掉可能遗留的对话框
  if ($('#dlg').classList.contains('show') && $('#dlgCancel')) { $('#dlgCancel').click(); await sleep(300); }

  out.autosaveOn = $('#setAutosave').getAttribute('aria-checked') === 'true';

  await window.__openPath(fA); await sleep(900);
  document.querySelector('#modeSeg button[data-m="edit"]').click(); await sleep(500);
  const pm = document.querySelector('#editor .ProseMirror');
  pm.click(); pm.focus();
  document.execCommand('insertText', false, '自动保存测试');
  await sleep(300);
  out.dirtyRightAfterEdit = window.__isDirty();      // 期望 true
  await sleep(1600);                                  // 等 900ms 自动保存落盘
  out.dirtyAfterAutosave = window.__isDirty();        // 期望 false
  out.modifiedDotCleared = !$('#docTitle').classList.contains('modified');
  out.statusText = $('#stSave').textContent;

  await window.__openPath(fB); await sleep(800);      // 落盘后切换：不应弹窗
  out.noDialogAfterAutosave = !$('#dlg').classList.contains('show');
  out.switchedToB = $('#docTitleText').textContent === 'test-switch-b.md';

  const aDisk = await window.mdr.readFile(fA);
  out.contentOnDisk = aDisk.text.includes('自动保存测试');
  out.errors = (window.__errors || []).length;
  out.pass = out.autosaveOn && out.dirtyRightAfterEdit === true && out.dirtyAfterAutosave === false
    && out.modifiedDotCleared === true && out.noDialogAfterAutosave === true
    && out.switchedToB && out.contentOnDisk && out.errors === 0;
  return out;
})();