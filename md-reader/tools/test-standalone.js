(async () => {
  const out = {};
  const $ = (s) => document.querySelector(s);
  out.url = location.protocol;
  out.engine = $('#stEngine')?.textContent;
  out.hasPM = !!document.querySelector('.ProseMirror');
  out.editable = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  out.h1 = document.querySelector('#editor h1')?.textContent?.slice(0, 30);
  out.headings = document.querySelectorAll('#editor h1,#editor h2,#editor h3').length;
  out.katex = document.querySelectorAll('#editor .katex').length;
  out.svg = document.querySelectorAll('#editor svg').length;
  out.tables = document.querySelectorAll('#editor table').length;
  out.outline = document.querySelectorAll('#outline .ol-item').length;
  out.banner = $('#banner')?.textContent || '';
  out.errors = window.__errors || [];
  // 快速交互冒烟：输入+保存
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p');
  const sel = getSelection(); const r = document.createRange();
  r.selectNodeContents(p); r.collapse(false);
  sel.removeAllRanges(); sel.addRange(r);
  document.execCommand('insertText', false, '【file协议实测】');
  await new Promise(res => setTimeout(res, 1500));
  out.typed = pm.textContent.includes('【file协议实测】');
  out.saved = $('#stSave')?.textContent;
  return out;
})()
