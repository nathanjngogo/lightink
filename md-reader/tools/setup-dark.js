(async () => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
  const css = document.querySelector('#css-frame-dark');
  if (css) css.media = 'all';
  return 'dark-no-doc';
})()
