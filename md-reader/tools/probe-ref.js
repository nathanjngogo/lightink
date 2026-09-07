(() => {
  const b = document.querySelector('#btnCloseDoc');
  const before = typeof b.onclick;
  b.click();
  return { onclickType: before, clicked: true,
           dlg: document.querySelector('#dlg').classList.contains('show'),
           back: !document.body.hasAttribute('data-doc-open') };
})()