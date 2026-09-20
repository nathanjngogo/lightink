// v1.0.19 UI 改版验证：工具栏右簇 / 侧栏分组 / 欢迎页 / 状态栏
(async () => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { steps: [] };
  const step = (n, ok, extra) => out.steps.push(`${ok ? '✓' : '✗'} ${n}${extra ? ' — ' + extra : ''}`);

  await sleep(1200);

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

  out.errors = (window.__errors || []).length;
  return out;
})();