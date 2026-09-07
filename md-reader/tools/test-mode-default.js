(async () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const out = {};
  // 1) 启动默认：阅读模式、第一按钮选中
  out.startupMode = document.body.dataset.mode;
  out.segOrder = $$('#modeSeg button').map(b => b.textContent);
  out.firstBtnOn = $$('#modeSeg button')[0].classList.contains('on') && $$('#modeSeg button')[0].dataset.m === 'read';
  out.stMode = $('#stMode').textContent;
  // 2) 打开文档 → 默认阅读、只读
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r => setTimeout(r, 1500));
  out.docMode = document.body.dataset.mode;
  out.readonly = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  out.h1 = document.querySelector('#editor h1')?.textContent;
  // 3) 切编辑可写
  $('[data-m="edit"]').click();
  await new Promise(r => setTimeout(r, 400));
  out.editMode = document.body.dataset.mode;
  out.editable = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  // 4) 再开另一个文档 → 回到阅读
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md');
  await new Promise(r => setTimeout(r, 1500));
  out.secondDocMode = document.body.dataset.mode;
  out.secondReadonly = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  // 5) 源码往返
  $('[data-m="source"]').click();
  await new Promise(r => setTimeout(r, 300));
  $('[data-m="edit"]').click();
  await new Promise(r => setTimeout(r, 500));
  out.cycleEdit = document.body.dataset.mode === 'edit';
  out.errs = window.__errors;
  return out;
})()
