(async () => {
  await window.__closeDoc();   // 包装版
  await new Promise(r=>setTimeout(r,300));
  return { dlgShown: document.querySelector('#dlg').classList.contains('show'),
           back: !document.body.hasAttribute('data-doc-open') };
})()