// v1.0.15 验证：A4 纸面宽度自适应
(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  const vis = (el) => getComputedStyle(el).display !== 'none';
  // ===== 1. 新建文档 → 纸面基准 794 =====
  $('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,300));
  $('#dlgInput').value = '自适应测试.md';
  $('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  const wrap = $('#editorWrap');
  let r0 = wrap.getBoundingClientRect();
  out.base = { width: Math.round(r0.width), isA4: wrap.classList.contains('a4-paper') };
  out.baseAt794 = Math.round(r0.width) === 794;
  // ===== 2. 粘贴宽表格（带格式）→ 纸面应加宽 =====
  const pm = document.querySelector('.ProseMirror');
  pm.focus();
  // 构造 HTML 粘贴（带内联格式的宽表格）
  let ths = '', rows = '';
  for (let i=0;i<20;i++) ths += `<th>产品规格列第${i+1}列参数名称很长很长</th>`;
  for (let r=0;r<6;r++) { let tds=''; for (let i=0;i<20;i++) tds += `<td>值-${r}-${i}</td>`; rows += `<tr>${tds}</tr>`; }
  const html = `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table><p>表格后段落</p>`;
  const dt = new DataTransfer();
  dt.setData('text/html', html);
  dt.setData('text/plain', '宽表格内容');
  const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
  pm.dispatchEvent(ev);
  await new Promise(r=>setTimeout(r,1200));
  const r1 = wrap.getBoundingClientRect();
  out.afterWideTable = {
    width: Math.round(r1.width),
    grew: r1.width > 900,
    grewBeyondBase: Math.round(r1.width) > 794,
  };
  // ===== 3. 删掉内容 → 纸面应缩回 794 =====
  pm.focus();
  const rg = document.createRange(); rg.selectNodeContents(pm);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('delete');
  await new Promise(r=>setTimeout(r,900));
  const r2 = wrap.getBoundingClientRect();
  out.afterClear = { width: Math.round(r2.width), backTo794: Math.round(r2.width) === 794 };
  out.errs = window.__errors;
  return out;
})()
