(async () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const out = {};
  // ===== 1. askText 弹窗取消（重命名使用的正是 askText）=====
  const pr = window.__askText('重命名文件夹', '旧名');
  await new Promise(r=>setTimeout(r,300));
  out.dlgShown = $('#dlg').classList.contains('show');
  out.inputValue = $('#dlgInput').value;
  out.cancelExists = !!$('#dlgCancel');
  $('#dlgCancel').click();
  const r1 = await pr;
  out.cancelReturnsNull = r1 === null;
  out.dlgClosed = !$('#dlg').classList.contains('show');
  // ===== 2. 取消后再开一次，确定路径不受影响 =====
  const pr2 = window.__askText('重命名文件夹', '旧名');
  await new Promise(r=>setTimeout(r,300));
  $('#dlgInput').value = '新名';
  $('#dlgOk').click();
  const r2 = await pr2;
  out.okReturnsNewName = r2 === '新名';
  // ===== 3. 端到端：真实书架重命名 → 取消 → 名称不变 =====
  const fid = await window.mdr.shelfFolderAdd('端到端测试夹');
  await window.__renderShelfData();
  await new Promise(r=>setTimeout(r,300));
  const renameBtn = $$('#realFiles [title*="重命名"]')[0] || $$('#realFiles .f-rename')[0];
  out.renameBtnFound = !!renameBtn;
  if (renameBtn) {
    renameBtn.click();
    await new Promise(r=>setTimeout(r,300));
    out.e2eDlgShown = $('#dlg').classList.contains('show');
    $('#dlgCancel').click();
    await new Promise(r=>setTimeout(r,400));
    out.e2eDlgClosed = !$('#dlg').classList.contains('show');
    const shelf = await window.mdr.shelfData();
    const folders = shelf.folders || shelf || [];
    const fn = (Array.isArray(folders)?folders:[]).find(x=>String(x.id)===String(fid));
    out.nameUnchanged = fn ? fn.name === '端到端测试夹' : JSON.stringify(shelf).slice(0,80);
    await window.mdr.shelfFolderRemove(fid);
  }
  out.errs = window.__errors;
  return out;
})()
