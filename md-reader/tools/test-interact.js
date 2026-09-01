(async () => {
  const out = {};
  const $ = (s) => document.querySelector(s);
  // 1) 任务列表渲染形态
  out.taskLi = document.querySelectorAll('#editor li[data-checked]').length;
  out.taskInput = document.querySelectorAll('#editor input[type=checkbox]').length;
  // 2) 输入测试
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p');
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(p); range.collapse(false);
  sel.removeAllRanges(); sel.addRange(range);
  document.execCommand('insertText', false, '【实测输入】');
  await new Promise(r => setTimeout(r, 1500));
  out.typed = pm.textContent.includes('【实测输入】');
  out.saveStatus = $('#stSave')?.textContent;
  out.savedLS = (localStorage.getItem('mdr:doc:demo') || '').includes('【实测输入】');
  // 3) 阅读模式
  $('[data-m="read"]').click();
  await new Promise(r => setTimeout(r, 300));
  out.readMode = document.body.dataset.mode;
  out.readEditable = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  // 4) 源码模式
  $('[data-m="source"]').click();
  await new Promise(r => setTimeout(r, 300));
  out.srcVisible = getComputedStyle($('#source')).display !== 'none';
  out.srcHasTyped = $('#source').value.includes('【实测输入】');
  // 5) 切回编辑
  $('[data-m="edit"]').click();
  await new Promise(r => setTimeout(r, 500));
  out.backToEdit = document.body.dataset.mode === 'edit';
  out.stillHasTyped = document.querySelector('.ProseMirror')?.textContent.includes('【实测输入】');
  // 6) 主题
  const t0 = document.documentElement.dataset.theme;
  $('#btnTheme').click();
  out.themeToggled = document.documentElement.dataset.theme !== t0;
  out.darkEnabled = !$('#css-frame-dark').disabled;
  $('#btnTheme').click();
  await new Promise(r => setTimeout(r, 100));
  // 7) 切换文档
  document.querySelector('.tree-item[data-doc="notes"]').click();
  await new Promise(r => setTimeout(r, 600));
  out.docSwitched = $('#docName')?.textContent;
  out.notesH1 = document.querySelector('#editor h1')?.textContent;
  // 8) 切回演示文档
  document.querySelector('.tree-item[data-doc="demo"]').click();
  await new Promise(r => setTimeout(r, 600));
  out.demoRestored = document.querySelector('#editor')?.textContent.includes('功能演示');
  out.errorsNow = window.__errors || [];
  return out;
})()
