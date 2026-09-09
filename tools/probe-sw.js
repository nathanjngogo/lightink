(() => {
  const btn = document.querySelector('#btnKeepMode');
  const sw = btn.querySelector('.mini-switch');
  return { aria: btn.getAttribute('aria-checked'), ls: localStorage.getItem('mdr:keepMode'),
           swBg: getComputedStyle(sw).backgroundColor, label: document.querySelector('#keepModeLabel').textContent };
})()