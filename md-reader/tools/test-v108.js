(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // ===== 1. 新建文档 → A4 纸面 =====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  $('#dlgInput').value = 'a4测试.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  const wrap = $('#editorWrap');
  const cs = getComputedStyle(wrap);
  out.isA4 = wrap.classList.contains('a4-paper');
  out.widthPx = cs.width;                       // 期望 794px
  out.bgWhite = cs.backgroundColor;             // 期望 rgb(255,255,255)
  out.minHeight = cs.minHeight;                 // 期望 1123px
  out.shadow = cs.boxShadow !== 'none';
  out.marginAuto = cs.marginLeft === cs.marginRight;
  // 几何：纸面是否居中且完整可见（不贴边）
  const r = wrap.getBoundingClientRect();
  out.rect = { left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
  out.fullyInViewport = r.left >= 0 && r.right <= innerWidth;
  // ProseMirror 至少撑一页
  const pm = wrap.querySelector('.ProseMirror');
  out.pmMinHeight = pm ? getComputedStyle(pm).minHeight : 'none';
  // ===== 2. 内容超过一页 → 无限延伸 =====
  pm.focus();
  const sel = getSelection(); sel.removeAllRanges();
  const rg = document.createRange(); rg.selectNodeContents(pm); rg.collapse(false);
  sel.addRange(rg);
  document.execCommand('insertText', false, '\n\n' + Array(120).fill('这是超出第一页的连续内容行，用于验证 A4 纸面在内容超过一页后向下无限延伸。').join('\n\n'));
  await new Promise(r=>setTimeout(r,900));
  const r2 = wrap.getBoundingClientRect();
  out.afterFill = { height: Math.round(r2.height), grew: r2.height > 1400 };
  // ===== 3. 切阅读模式 → 纸面保持 =====
  document.querySelector('#modeSeg button[data-m="read"]').click();
  await new Promise(r=>setTimeout(r,400));
  out.readKeepsA4 = wrap.classList.contains('a4-paper');
  // ===== 4. 关闭 → 主页移除纸面 =====
  document.querySelector('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,300));
  $('#dlgDiscard')?.click();
  await new Promise(r=>setTimeout(r,400));
  out.closedRemovesA4 = !wrap.classList.contains('a4-paper');
  // ===== 5. 打开已有文件 → 常规版心（无纸面） =====
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r=>setTimeout(r,1200));
  out.existingDocNoA4 = !wrap.classList.contains('a4-paper');
  out.errs = window.__errors;
  return out;
})()
