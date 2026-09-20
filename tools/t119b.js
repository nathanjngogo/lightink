// v1.0.19 UI 改版验证：工具栏右簇 / 侧栏分组 / 欢迎页 / 状态栏
(async () => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { steps: [] };
  const step = (n, ok, extra) => out.steps.push(`${ok ? '✓' : '✗'} ${n}${extra ? ' — ' + extra : ''}`);

  await sleep(1200);

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
  return out;
})();