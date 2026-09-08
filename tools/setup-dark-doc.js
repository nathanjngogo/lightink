(async () => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
  const css = document.querySelector('#css-frame-dark');
  if (css) css.media = 'all';
  document.querySelector('#recentList .w-item').click();
  await new Promise(r => setTimeout(r, 1200));
  return 'doc-open-dark';
})()
