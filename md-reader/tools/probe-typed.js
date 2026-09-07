(() => {
  const pm = document.querySelector('.ProseMirror');
  return { pmText: pm.textContent.slice(0, 50), hasXYZ: pm.textContent.includes('XYZ'), focused: document.activeElement === pm };
})()