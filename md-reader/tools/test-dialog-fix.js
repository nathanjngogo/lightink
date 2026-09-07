(async () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const out = {};
  // 模拟用户输入：劫持 askText/askConfirm 不行（module 作用域），改用 DOM 驱动对话框
  async function fillDlg(value){
    await new Promise(r => setTimeout(r, 250));
    const input = $('#dlgInput');
    input.value = value;
    $('#dlgOk').click();
    await new Promise(r => setTimeout(r, 400));
  }
  async function confirmDlg(){
    await new Promise(r => setTimeout(r, 250));
    $('#dlgOk').click();
    await new Promise(r => setTimeout(r, 400));
  }

  /* 1. 新建文件夹（对话框输入名称） */
  $$('.shelf-bar .shelf-btn')[0].click();
  await fillDlg('V102修复验证');
  let data = await window.mdr.shelfData();
  out.folderCreated = data.folders.some(f => f.name === 'V102修复验证');
  const fid = data.folders.find(f => f.name === 'V102修复验证').id;
  // 2. 加两个文件
  await window.mdr.shelfFileAdd(fid, 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await window.mdr.shelfFileAdd(fid, 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/assoc-test.md');
  await window.__renderShelfData();
  await new Promise(r => setTimeout(r, 300));
  out.filesLinked = (await window.mdr.shelfData()).folders.find(f => f.id === fid).files.length === 2;
  // 3. 重命名（对话框）
  $$('.shelf-folder .shelf-btn')[0].click();
  await fillDlg('V102改名成功');
  data = await window.mdr.shelfData();
  out.folderRenamed = data.folders.some(f => f.name === 'V102改名成功');
  // 4. 删除文件夹（confirm 对话框）
  $$('.shelf-folder .shelf-btn')[1].click();
  await confirmDlg();
  data = await window.mdr.shelfData();
  out.folderDeleted = !data.folders.some(f => f.id === fid);
  out.sourceIntact = await window.mdr.fileExists('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  // 5. 新建文档（对话框命名）
  $('#btnNewDoc').click();
  await fillDlg('v102修复-新文档.md');
  await new Promise(r => setTimeout(r, 1200));
  out.newDocOpened = $('#docTitleText').textContent.includes('v102修复-新文档');
  out.newDocMode = document.body.dataset.mode;
  // 6. 编辑后关闭 → 守卫对话框
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, '对话框守卫验证');
  await new Promise(r => setTimeout(r, 300));
  document.querySelector('#btnCloseDoc').click();
  await fillDlg('v102修复-已保存.md');
  await new Promise(r => setTimeout(r, 600));
  out.backToWelcome = !document.body.hasAttribute('data-doc-open');
  out.guardSaved = await window.mdr.fileExists('C:/Users/1/Documents/我的新笔记-已存.md'.replace('我的新笔记-已存','v102修复-已保存'));
  out.errs = window.__errors;
  return out;
})()
