(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 准备：确保有 3 条记录（打开 3 个文档）
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r => setTimeout(r, 600));
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/assoc-test.md');
  await new Promise(r => setTimeout(r, 600));
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/pdf-test.md');
  await new Promise(r => setTimeout(r, 800));
  out.recentsBefore = (await window.mdr.listRecents()).length;
  // 回主页
  window.__closeDoc();
  await new Promise(r => setTimeout(r, 300));
  out.rowsOnWelcome = document.querySelectorAll('#recentList .w-item').length;
  out.clearBtnVisible = !$('#btnClearRecents').hidden;
  // 单项删除：点第一行的 ✕
  const firstDel = document.querySelector('#recentList .w-item .w-del');
  const firstPathBefore = (await window.mdr.listRecents())[0].path;
  firstDel.click();
  await new Promise(r => setTimeout(r, 400));
  const after = await window.mdr.listRecents();
  out.afterSingleRemove = after.length;
  out.firstEntryGone = !after.some(r => r.path === firstPathBefore);
  out.rowsSynced = document.querySelectorAll('#recentList .w-item').length === after.length;
  // 全部清除
  $('#btnClearRecents').click();
  await new Promise(r => setTimeout(r, 400));
  out.afterClearAll = (await window.mdr.listRecents()).length;
  out.clearBtnHiddenWhenEmpty = $('#btnClearRecents').hidden;
  out.emptyMsg = document.querySelector('#recentList').textContent.includes('暂无最近文件');
  // 重建记录供后续使用
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r => setTimeout(r, 600));
  out.rebuilt = (await window.mdr.listRecents()).length >= 1;
  out.errs = window.__errors;
  return out;
})()
