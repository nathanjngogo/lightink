(() => {
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p') || pm.querySelector('h1');
  const rg = document.createRange(); rg.selectNodeContents(p); rg.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
  document.execCommand('insertText', false, 'Q');
  return { modified: document.querySelector('#docTitle').classList.contains('modified'),
           save: document.querySelector('#stSave').textContent,
           hasQ: pm.textContent.includes('Q') };
})()