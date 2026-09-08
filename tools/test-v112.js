// v1.0.12 布局验证：命令面板入口居中加宽 + 关闭文档按钮移至工具栏
(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // ===== 1. 打开文档让关闭按钮出现 =====
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r=>setTimeout(r,1200));
  const bd = $('#btnCloseDoc');
  out.closeDoc = {
    inToolbar: !!bd.closest('#toolbar'),
    notInTitlebar: !bd.closest('header'),
    visible: !bd.hidden,
  };
  // 位置：工具栏内、搜索按钮右侧、主题按钮左侧
  const order = [...document.querySelectorAll('#toolbar > *')].map(e => e.id || e.className);
  out.toolbarOrder = order;
  // ===== 2. 命令面板入口居中 =====
  const pal = $('#btnPalette');
  const pr = pal.getBoundingClientRect();
  const tr = $('#toolbar').getBoundingClientRect();
  const centerOffset = Math.abs((pr.left + pr.width/2) - (tr.left + tr.width/2));
  out.paletteBtn = {
    width: Math.round(pr.width),
    horizCentered: centerOffset < 60,       // 容差：右组宽度导致略偏
    centerOffsetPx: Math.round(centerOffset),
    text: pal.textContent.replace(/\s+/g,' ').trim(),
  };
  // ===== 3. 面板弹层宽度 =====
  pal.click();
  await new Promise(r=>setTimeout(r,300));
  const box = $('#palette .box').getBoundingClientRect();
  out.paletteBox = { width: Math.round(box.width), shown: $('#palette').classList.contains('show') };
  // 面板居中于窗口
  const wOff = Math.abs((box.left + box.width/2) - innerWidth/2);
  out.paletteBoxCentered = wOff < 10;
  $('#palInput').value = ''; 
  document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
  await new Promise(r=>setTimeout(r,200));
  // ===== 4. 关闭文档按钮功能：点击回主页 =====
  bd.click();
  await new Promise(r=>setTimeout(r,400));
  out.closeWorks = !document.body.hasAttribute('data-doc-open');
  out.closeHiddenAgain = bd.hidden;
  out.errs = window.__errors;
  return out;
})()
