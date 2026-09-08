(async () => {
  window.prompt = () => 'v102-守卫测试2.md';
  await window.__createNewDoc();
  await new Promise(r => setTimeout(r, 1200));
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const sel = getSelection(); const rg = document.createRange();
  rg.selectNodeContents(p); rg.collapse(false);
  sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, '守卫测试内容');
  await new Promise(r => setTimeout(r, 300));
  window.prompt = () => 'v102-守卫保存.md';
  await window.__closeDoc();
  await new Promise(r => setTimeout(r, 600));
  const savedExists = await window.mdr.fileExists('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/v102-守卫保存.md');
  return { backToWelcome: !document.body.hasAttribute('data-doc-open'), savedExists };
})()