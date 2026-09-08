(async () => {
  const pm = document.querySelector('.ProseMirror');
  return { innerHTML: pm.innerHTML.slice(0, 300),
           scrollWidth: pm.scrollWidth,
           tables: pm.querySelectorAll('table').length };
})()