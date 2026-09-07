(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // ===== 新建内存文档 → 编辑 → 关闭守卫弹窗改名保存 =====
  window.__stubPrompt = (v) => { window.__promptRet = v; };
  // 1) 新建（prompt 返回文档名）
  window.prompt = () => '我的新笔记.md';
  await window.__createNewDoc();
  await new Promise(r => setTimeout(r, 1500));
  out.newDocName = $('#docTitleText').textContent;
  out.unsavedHint = $('#stSave').textContent.includes('未保存');
  out.mode = document.body.dataset.mode;
  // 2) 编辑打字
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, 'Hello LightInk');
  await new Promise(r => setTimeout(r, 300));
  out.dirty = $('#docTitle').classList.contains('modified');
  // 3) 关闭 → 守卫 prompt 问保存名 → 返回自定义名
  window.prompt = () => '我的新笔记-已存.md';
  await window.__closeDoc();
  await new Promise(r => setTimeout(r, 800));
  out.backToWelcome = !document.body.hasAttribute('data-doc-open');
  // 验证保存到了 Documents
  out.savedExists = await window.mdr.fileExists('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/../..//Documents/我的新笔记-已存.md'.replace('/md-reader/../..//','/'));
  // 用标准 Documents 路径
  out.savedExists2 = await window.mdr.fileExists('C:/Users/1/Documents/我的新笔记-已存.md');
  // 4) 清理测试文件
  out.errs = window.__errors;
  return out;
})()
