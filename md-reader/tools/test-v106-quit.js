// 真退出链路验证：选退出+记住 → settings.closeAction=exit → 进程退出
(async () => {
  const $ = (s) => document.querySelector(s);
  $('#btnClose').click();
  await new Promise(r=>setTimeout(r,400));
  $('#dlgRemember').checked = true;
  $('#dlgQuit').click();
  await new Promise(r=>setTimeout(r,800));
  return { dlgClosed: !$('#dlg').classList.contains('show') };
})()
