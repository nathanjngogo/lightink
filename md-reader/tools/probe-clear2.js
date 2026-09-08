(async () => {
  const pm = document.querySelector('.ProseMirror');
  pm.focus();
  const sel = getSelection();
  sel.removeAllRanges();
  const rg = document.createRange(); rg.selectNodeContents(pm);
  sel.addRange(rg);
  document.execCommand('selectAll');
  document.execCommand('delete');
  await new Promise(r=>setTimeout(r,600));
  const wrap = document.querySelector('#editorWrap');
  const r2 = wrap.getBoundingClientRect();
  return { tables: pm.querySelectorAll('table').length,
           width: Math.round(r2.width),
           backTo794: Math.round(r2.width) === 794 };
})()