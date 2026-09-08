(async () => {
  document.querySelector('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  document.querySelector('#dlgInput').value = 'probe-guard2.md';
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1500));
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
  document.execCommand('insertText', false, 'probe2');
  await new Promise(r=>setTimeout(r,1000));
  const modified = document.querySelector('#docTitle').classList.contains('modified');
  document.querySelector('#btnCloseDoc').click();
  await new Promise(r=>setTimeout(r,300));
  const dlgShown = document.querySelector('#dlg').classList.contains('show');
  let saved = false;
  if (dlgShown) {
    document.querySelector('#dlgInput').value = 'probe-guard2-saved.md';
    document.querySelector('#dlgOk').click();
    await new Promise(r=>setTimeout(r,700));
    saved = await window.mdr.fileExists('C:/Users/1/Documents/probe-guard2-saved.md');
  }
  return { modified, dlgShown, saved };
})()