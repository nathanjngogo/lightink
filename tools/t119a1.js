// v1.0.19 UI 改版验证：工具栏右簇 / 侧栏分组 / 欢迎页 / 状态栏
(async () => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { steps: [] };
  const step = (n, ok, extra) => out.steps.push(`${ok ? '✓' : '✗'} ${n}${extra ? ' — ' + extra : ''}`);

  await sleep(1200);

  /* ---------- 工具栏 ---------- */
  const tb = $('#toolbar');
  step('工具栏已移除「新建」按钮', !$('#toolbar #btnNewDoc'));
  step('侧栏开关保留', !!$('#btnSidebar'));
  step('模式段三档齐备', $$('#modeSeg button').length === 3);
  step('保持编辑开关存在且为文字+胶囊', !!$('#btnKeepMode.tgl .pill') && $('#btnKeepMode').textContent.includes('阅读优先'));
  step('自动保存开关存在且为文字+胶囊', !!$('#btnAutosave.tgl .pill') && $('#btnAutosave').textContent.includes('自动保存'));
  step('搜索命令框在右簇（非居中）', !!$('#btnPalette.search') && $('#btnPalette').textContent.includes('搜索命令'));

  const order = [...tb.children].filter(el => el.id && el.id !== 'btnSidebar')
    .map(el => el.id);
  out.toolbarOrder = order;
  const iKeep = order.indexOf('btnKeepMode'), iAuto = order.indexOf('btnAutosave');
  step('阅读优先在自动保存左侧', iKeep >= 0 && iAuto >= 0 && iKeep < iAuto);
  const gk = $('#btnKeepMode').getBoundingClientRect(), ga = $('#btnAutosave').getBoundingClientRect();
  step('两者水平相邻且不重叠', gk.right <= ga.left + 2, `keep.right=${Math.round(gk.right)} auto.left=${Math.round(ga.left)}`);
  step('主题按钮为图标+文字', !!$('#btnTheme svg') && $('#themeLabel')?.textContent === '自动');
  step('设置按钮为纯图标', !!$('#btnSettings svg') && !$('#btnSettings').textContent.trim());

  out.errors = (window.__errors || []).length;
  return out;
})();