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

  /* ---------- 侧栏 ---------- */
  step('侧栏底部有「新建文档」按钮', !!$('#sidebar .side-foot #btnNewDoc') && $('#btnNewDoc').textContent.includes('新建文档'));
  step('侧栏有搜索图标与新建文件夹图标', !!$('#btnSideSearch') && !!$('#btnSideNewFolder'));
  step('「最近打开」分组与角标存在', !!$('#sideRecents') && !!$('#sideRecentsCount'));
  step('「我的书架」分组与角标存在', !!$('#sideShelfCount') && !!$('#realFiles'));
  // 展开书架页签看分组渲染
  $('#tabShelf').click(); await sleep(700);
  out.sideRecentsCount = $('#sideRecentsCount').textContent;
  out.sideShelfCount = $('#sideShelfCount').textContent;
  out.sideRecentsItems = $$('#sideRecents .tree-item').length;
  step('最近打开列表已渲染', out.sideRecentsItems > 0, `${out.sideRecentsItems} 项`);
  // 侧栏搜索
  $('#btnSideSearch').click(); await sleep(200);
  step('侧栏搜索行可展开', !$('#sideSearchRow').hidden);
  $('#sideSearchInput').value = 'zzz-不存在';
  $('#sideSearchInput').dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(300);
  const visible = $$('#sideRecents .tree-item').filter(el => el.style.display !== 'none').length;
  step('侧栏搜索可过滤', visible === 0, `匹配 ${visible} 项`);
  $('#sideSearchInput').value = '';
  $('#sideSearchInput').dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(200);
  $('#btnSideSearch').click(); await sleep(200);

  /* ---------- 欢迎页 ---------- */
  step('品牌区为大图标+标题+副标题+标签', !!$('#welcome .w-brand .w-logo') && !!$('#welcome h1'));
  const lg = $('#welcome .w-logo').getBoundingClientRect();
  step('图标尺寸 64px', Math.round(lg.width) === 64 && Math.round(lg.height) === 64, `${Math.round(lg.width)}×${Math.round(lg.height)}`);
  const tags = $$('#welcome .w-tag').map(t => t.textContent);
  out.welcomeTags = tags;
  step('两个标签：版本 + 本地优先', tags.length === 2 && tags[1] === '本地优先');
  step('最近打开含相对时间', $$('#recentList .w-item .meta').length > 0,
       ($$('#recentList .w-item .meta')[0]?.textContent || '(空)'));
  step('清除记录按钮文案', $('#btnClearRecents').textContent === '清除记录');
  step('提示文案已更新', $('#dropHint').textContent.startsWith('提示：'));
  step('按钮组：打开文件 + 打开文件夹', !!$('#btnOpenFile') && !!$('#btnOpenDir'));

  /* ---------- 状态栏 ---------- */
  step('状态栏含文档数', /\d+ 个文档/.test($('#stDocs').textContent), $('#stDocs').textContent);
  step('状态栏含编码与换行符', $('#stEnc').textContent === 'UTF-8' && ['LF', 'CRLF'].includes($('#stEol').textContent),
       $('#stEnc').textContent + ' / ' + $('#stEol').textContent);
  step('状态栏已移除渲染引擎项', !$('#stEngine'));

  /* ---------- 交互：自动保存双开关联动 ---------- */
  const before = $('#btnAutosave').getAttribute('aria-checked');
  $('#btnAutosave').click(); await sleep(350);
  const afterToolbar = $('#btnAutosave').getAttribute('aria-checked');
  const drawerSync = $('#setAutosave').getAttribute('aria-checked');
  step('工具栏自动保存可切换', before !== afterToolbar, `${before} → ${afterToolbar}`);
  step('设置抽屉开关同步', drawerSync === afterToolbar, `抽屉=${drawerSync}`);
  $('#btnAutosave').click(); await sleep(300);
  step('可切回开启', $('#btnAutosave').getAttribute('aria-checked') === before);

  /* ---------- 交互：保持编辑开关 ---------- */
  const kb = $('#btnKeepMode').getAttribute('aria-checked');
  $('#btnKeepMode').click(); await sleep(350);
  const ka = $('#btnKeepMode').getAttribute('aria-checked');
  step('保持编辑开关可切换', kb !== ka, `${kb} → ${ka}`);
  step('标签随之更新', $('#keepModeLabel').textContent === (ka === 'true' ? '保持编辑' : '阅读优先'),
       $('#keepModeLabel').textContent);
  $('#btnKeepMode').click(); await sleep(300);

  out.errors = (window.__errors || []).length;
  out.pass = out.steps.every(s => s.startsWith('✓')) && out.errors === 0;
  return out;
})();