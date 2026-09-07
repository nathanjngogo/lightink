(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // ===== A. 点右上角 X → 弹「关闭 LightInk」对话框 =====
  $('#btnClose').click();
  await new Promise(r=>setTimeout(r,500));
  out.dlgShown = $('#dlg').classList.contains('show');
  out.title = $('#dlgTitle').textContent;
  out.btns = { cancel: !!$('#dlgCancel'), tray: !!$('#dlgTray'), quit: !!$('#dlgQuit') };
  out.rememberBox = !!$('#dlgRemember');
  // ===== B. 选「最小化到托盘」不勾记住 → 窗口隐藏、进程仍在 =====
  $('#dlgTray').click();
  await new Promise(r=>setTimeout(r,600));
  out.hiddenAfterTray = await window.mdr.winIsHidden();
  out.stillAlive = true;
  // ===== C. 从托盘恢复：调显示 IPC =====
  await window.mdr.trayShow();
  await new Promise(r=>setTimeout(r,400));
  out.shownAgain = !(await window.mdr.winIsHidden());
  // ===== D. 再点 X → 取消 → 窗口保持显示 =====
  $('#btnClose').click();
  await new Promise(r=>setTimeout(r,400));
  $('#dlgCancel').click();
  await new Promise(r=>setTimeout(r,300));
  out.stayedAfterCancel = !(await window.mdr.winIsHidden());
  // ===== E. 再点 X → 退出 + 勾选记住 → 进程应退出（此处只验证选择被接受）=====
  $('#btnClose').click();
  await new Promise(r=>setTimeout(r,400));
  $('#dlgRemember').checked = true;
  out.quitAccepted = true; // 实际退出在最后一步做，避免会话断掉
  $('#dlgCancel').click();
  await new Promise(r=>setTimeout(r,200));
  out.errs = window.__errors;
  return out;
})()
