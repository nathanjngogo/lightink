(async () => {
  window.prompt_probe = [];
  // 再来一轮：新建 → 编辑 → 关闭
  document.querySelector('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  const inp = document.querySelector('#dlgInput');
  inp.value = 'probe-guard.md';
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1200));
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
  document.execCommand('insertText', false, 'probe');
  await new Promise(r=>setTimeout(r,200));
  document.querySelector('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,250));
  const di = document.querySelector('#dlgInput');
  window.prompt_probe.push({ dlgVisible: document.querySelector('#dlg').classList.contains('show'), dlgValue: di ? di.value : null });
  di.value = 'probe-guard-saved.md';
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,600));
  return {
    dlgFlow: window.prompt_probe,
    back: !document.body.hasAttribute('data-doc-open'),
    exists: await window.mdr.fileExists('C:/Users/1/Documents/probe-guard-saved.md')
  };
})()