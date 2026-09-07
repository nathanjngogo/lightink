(async () => {
  const $ = s => document.querySelector(s);
  document.querySelector('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  document.querySelector('#dlgInput').value = 'probe-g2.md';
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1200));
  const s0 = window.__getDirtyGuard();
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, 'X');
  const s1 = window.__getDirtyGuard();
  await new Promise(r=>setTimeout(r,1000));
  const s2 = window.__getDirtyGuard();
  document.querySelector('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,400));
  const dlg = document.querySelector('#dlg').classList.contains('show');
  const s3 = window.__getDirtyGuard();
  return { s0_afterCreate: s0, s1_afterType: s1, s2_afterAutosave: s2, dlgShown: dlg, s3_afterClose: s3 };
})()