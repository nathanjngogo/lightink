(() => {
  const pm = document.querySelector('.ProseMirror');
  const items = [...pm.querySelectorAll('li')].slice(0, 12).map(li => ({
    cls: li.className.slice(0, 60),
    checked: li.getAttribute('data-checked'),
    text: li.textContent.slice(0, 24),
    hasLabel: !!li.querySelector('label, .checkbox, input'),
  }));
  // 找包含「已完成」的 li
  const done = [...pm.querySelectorAll('li')].find(li => li.textContent.includes('已完成'));
  return {
    liCount: pm.querySelectorAll('li').length,
    sample: items,
    doneOuter: done ? done.outerHTML.slice(0, 400) : 'NOT FOUND',
  };
})()
