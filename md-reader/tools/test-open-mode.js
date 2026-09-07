(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 模拟真实用户路径：欢迎页 → 点击最近文件（w-item）
  await new Promise(r => setTimeout(r, 500));
  const item = document.querySelector('#recentList .w-open, #recentList .w-item');
  out.hasRecent = !!item;
  if (item) { item.click(); await new Promise(r => setTimeout(r, 1500)); }
  out.afterRecentMode = document.body.dataset.mode;
  out.afterRecentRO = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  out.stMode = $('#stMode')?.textContent;
  // 切到编辑 → 关闭 → 再开另一文件
  document.querySelector('[data-m="edit"]').click();
  await new Promise(r => setTimeout(r, 400));
  out.editMode = document.body.dataset.mode;
  window.__closeDoc();
  await new Promise(r => setTimeout(r, 300));
  // 再开
  const item2 = document.querySelector('#recentList .w-open, #recentList .w-item');
  if (item2) { item2.click(); await new Promise(r => setTimeout(r, 1500)); }
  out.secondOpenMode = document.body.dataset.mode;
  out.secondRO = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  // 命令面板「打开文件」路径（走 native dialog，不能自动；验证 openPath 直调）
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md');
  await new Promise(r => setTimeout(r, 1500));
  out.openPathMode = document.body.dataset.mode;
  out.openPathRO = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  out.errs = window.__errors;
  return out;
})()
