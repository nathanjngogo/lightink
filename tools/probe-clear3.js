(async () => {
  const pm = document.querySelector('.ProseMirror');
  pm.focus();
  document.dispatchEvent(new KeyboardEvent('keydown', {key:'a', code:'KeyA', ctrlKey:true, bubbles:true}));
  pm.dispatchEvent(new KeyboardEvent('keydown', {key:'a', code:'KeyA', ctrlKey:true, bubbles:true}));
  // 直接对活动元素派发
  const el = document.activeElement || pm;
  ['a'].forEach(()=>{});
  el.dispatchEvent(new KeyboardEvent('keydown', {key:'a', ctrlKey:true, bubbles:true, cancelable:true}));
  el.dispatchEvent(new KeyboardEvent('keydown', {key:'Backspace', bubbles:true, cancelable:true}));
  await new Promise(r=>setTimeout(r,600));
  const wrap = document.querySelector('#editorWrap');
  return { tables: pm.querySelectorAll('table').length,
           width: Math.round(wrap.getBoundingClientRect().width),
           html: pm.innerHTML.slice(0,150) };
})()