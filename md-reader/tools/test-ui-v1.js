(async () => {
  const out = {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  // 启动态
  out.welcomeVisible = getComputedStyle($('#welcome')).display !== 'none' && $('#welcome').offsetParent !== null;
  out.recentItems = $$('#recentList .w-item').length;
  out.engine = $('#stEngine')?.textContent;
  out.errors = window.__errors || [];
  // 打开演示文档
  $('#recentList .w-item').click();
  await new Promise(r => setTimeout(r, 800));
  out.docOpened = document.body.hasAttribute('data-doc-open');
  out.title = $('#docTitle')?.textContent;
  out.hasPM = !!document.querySelector('.ProseMirror');
  out.h1 = document.querySelector('#editor h1')?.textContent?.slice(0, 24);
  out.outline = $$('#outlinePane .ol-item').length;
  out.count = $('#stCount')?.textContent;
  // 编辑 → 标题圆点 + 自动保存
  const pm = document.querySelector('.ProseMirror');
  const p = pm.querySelector('p');
  const sel = getSelection(); const rg = document.createRange();
  rg.selectNodeContents(p); rg.collapse(false);
  sel.removeAllRanges(); sel.addRange(rg);
  document.execCommand('insertText', false, '【UI版】');
  await new Promise(r => setTimeout(r, 1400));
  out.titleDot = $('#docTitle').classList.contains('modified');
  out.saved = $('#stSave')?.textContent;
  // 三态切换
  $('[data-m="read"]').click();
  await new Promise(r => setTimeout(r, 250));
  out.readRO = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  $('[data-m="source"]').click();
  await new Promise(r => setTimeout(r, 250));
  out.srcVisible = getComputedStyle($('#source')).display !== 'none';
  $('[data-m="edit"]').click();
  await new Promise(r => setTimeout(r, 500));
  out.backEdit = document.body.dataset.mode === 'edit' && document.querySelector('.ProseMirror')?.textContent.includes('【UI版】');
  // 设置抽屉：字号
  $('#btnSettings').click();
  await new Promise(r => setTimeout(r, 300));
  out.drawerShown = $('#drawer').classList.contains('show');
  const setFs = $('#setFs');
  setFs.value = 20; setFs.dispatchEvent(new Event('input', { bubbles: true }));
  out.fsApplied = document.querySelector('#editorWrap').style.fontSize === '20px';
  setFs.value = 17; setFs.dispatchEvent(new Event('input', { bubbles: true }));
  $('#btnCloseDrawer').click();
  // 命令面板
  $('#btnPalette').click();
  await new Promise(r => setTimeout(r, 200));
  out.palShown = $('#palette').classList.contains('show');
  out.palItems = $$('#palList .p-item').length;
  const inp = $('#palInput');
  inp.value = '阅读'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 150));
  out.palFiltered = $$('#palList .p-item').length;
  inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true }));
  $('#palette .scrim2').click();
  // 主题
  const th0 = document.documentElement.dataset.theme;
  $('#btnTheme').click();
  out.themeCycled = document.documentElement.dataset.theme !== th0;
  // 侧栏
  $('#btnSidebar').click();
  await new Promise(r => setTimeout(r, 250));
  out.sideHidden = document.body.classList.contains('side-hidden');
  $('#btnSidebar').click();
  out.errorsEnd = window.__errors || [];
  return out;
})()
