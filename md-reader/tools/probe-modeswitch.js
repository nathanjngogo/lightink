(async () => {
  const btn = document.querySelector('[data-m="edit"]');
  const before = document.body.dataset.mode;
  btn.click();
  await new Promise(r=>setTimeout(r,500));
  const after = document.body.dataset.mode;
  // 手动派发 MouseEvent 试试
  btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
  await new Promise(r=>setTimeout(r,500));
  const after2 = document.body.dataset.mode;
  return { before, after, after2, btnExists: !!btn, btnHandler: typeof btn.onclick };
})()