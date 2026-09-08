(async () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const out = {};
  window.__errs = [];
  window.addEventListener('error', e => window.__errs.push(e.message));

  /* ===== 1. 书架 v2：新建文件夹 → 加文件 → 重命名 → 单独移除文件 → 删除文件夹 ===== */
  // 新建文件夹
  window.prompt = () => '测试分类A';
  await window.__renderShelfData();
  const addFolderBtn = $$('.shelf-bar .shelf-btn')[0];
  addFolderBtn.click();
  await new Promise(r => setTimeout(r, 500));
  let data = await window.mdr.shelfData();
  out.folderCreated = data.folders.some(f => f.name === '测试分类A');
  // 把 test-doc.md 加入该文件夹
  const fid = data.folders.find(f => f.name === '测试分类A').id;
  await window.mdr.shelfFileAdd(fid, 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await window.mdr.shelfFileAdd(fid, 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/assoc-test.md');
  await window.__renderShelfData();
  await new Promise(r => setTimeout(r, 300));
  data = await window.mdr.shelfData();
  const folder = data.folders.find(f => f.name === '测试分类A');
  out.filesLinked = folder.files.length === 2;
  out.fileRowsShown = $$('.shelf-file-row').length;
  // 重命名
  window.prompt = () => '测试分类B';
  const renameBtn = $$('.shelf-folder .shelf-btn')[0];
  renameBtn.click();
  await new Promise(r => setTimeout(r, 500));
  data = await window.mdr.shelfData();
  out.folderRenamed = data.folders.some(f => f.name === '测试分类B');
  // 移除其中一个文件
  await window.mdr.shelfFileRemove(fid, 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/assoc-test.md');
  data = await window.mdr.shelfData();
  out.fileRemoved = data.folders.find(f => f.id === fid).files.length === 1;
  // 删除文件夹
  window.confirm = () => true;
  $$('.shelf-folder .shelf-btn')[1].click();
  await new Promise(r => setTimeout(r, 500));
  data = await window.mdr.shelfData();
  out.folderDeleted = !data.folders.some(f => f.id === fid);
  // 源文件仍存在
  out.sourceFileIntact = await window.mdr.fileExists('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');

  /* ===== 2. 新建文档 ===== */
  window.prompt = () => 'v102-测试新建.md';
  await window.__createNewDoc();
  await new Promise(r => setTimeout(r, 1500));
  out.newDocOpened = $('#docTitleText').textContent.includes('v102-测试新建');
  out.newDocEditable = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  out.newDocMode = document.body.dataset.mode;
  out.newDocH1 = document.querySelector('#editor h1')?.textContent;

  /* ===== 3. txt 关联打开 ===== */
  window.fs_write = null;
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-note.txt');
  await new Promise(r => setTimeout(r, 1200));
  out.txtOpened = $('#docTitleText').textContent === 'test-note.txt';
  out.txtHasPM = !!document.querySelector('.ProseMirror');
  out.txtMode = document.body.dataset.mode;

  out.errs = window.__errs || window.__errors;
  return out;
})()
