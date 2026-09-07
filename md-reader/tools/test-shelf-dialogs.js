(async () => {
  const out = {};
  // 新建文件夹 → 重命名 → 删除（全部走应用内对话框）
  const btns = () => [...document.querySelectorAll('.shelf-bar .shelf-btn')];
  btns()[0].click();                                   // 新建
  await new Promise(r=>setTimeout(r,250));
  document.querySelector('#dlgInput').value = '删除流程验证';
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,400));
  let d = await window.mdr.shelfData();
  out.created = d.folders.some(f => f.name === '删除流程验证');
  const fid = d.folders.find(f => f.name === '删除流程验证').id;
  // 重命名
  [...document.querySelectorAll('.shelf-folder .shelf-btn')][0].click();
  await new Promise(r=>setTimeout(r,250));
  document.querySelector('#dlgInput').value = '删除流程验证-改名';
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,400));
  d = await window.mdr.shelfData();
  out.renamed = d.folders.some(f => f.name === '删除流程验证-改名');
  // 删除（confirm 对话框 → 点确定）
  [...document.querySelectorAll('.shelf-folder .shelf-btn')][1].click();
  await new Promise(r=>setTimeout(r,250));
  out.confirmShown = document.querySelector('#dlg').classList.contains('show');
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,400));
  d = await window.mdr.shelfData();
  out.deleted = !d.folders.some(f => f.id === fid);
  out.errs = window.__errors;
  return out;
})()