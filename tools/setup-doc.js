(async () => {
  localStorage.clear();
  document.querySelector('#recentList .w-item').click();
  await new Promise(r => setTimeout(r, 1200));
  return 'doc-open-light';
})()
