(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 用户真实安装版：打开文件走完整流程
  out.welcomeMode = document.body.dataset.mode;
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r => setTimeout(r, 2000));
  out.afterOpenMode = document.body.dataset.mode;
  out.afterOpenRO = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  out.stMode = $('#stMode')?.textContent;
  out.segOn = [...document.querySelectorAll('#modeSeg button')].filter(b=>b.classList.contains('on')).map(b=>b.dataset.m);
  // 模拟用户“关闭 → 再打开”多轮
  window.__closeDoc();
  await new Promise(r => setTimeout(r, 300));
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md');
  await new Promise(r => setTimeout(r, 2000));
  out.secondMode = document.body.dataset.mode;
  // 从书架打开
  const shelfItem = document.querySelector('#realFiles .tree-item');
  if (shelfItem) { shelfItem.click(); await new Promise(r => setTimeout(r, 1800)); }
  out.shelfOpenMode = document.body.dataset.mode;
  out.errs = window.__errors;
  return out;
})()
