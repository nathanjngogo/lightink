// v1.0.19 修复验证：打开不写盘 + 行尾保持
(async () => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { steps: [] };
  const step = (n, ok, extra) => out.steps.push(`${ok ? '✓' : '✗'} ${n}${extra ? ' — ' + extra : ''}`);
  const D = 'C:/Users/1/Documents/ChatGPT/软件开发/tools';
  const CRLF = D + '/eol-crlf.md', LF = D + '/eol-lf.md';

  // 清掉可能遗留的对话框
  if ($('#dlg') && $('#dlg').classList.contains('show') && $('#dlgCancel')) { $('#dlgCancel').click(); await sleep(300); }
  if (document.body.hasAttribute('data-doc-open') && window.__closeDoc) { window.__closeDoc(); await sleep(500);
    if ($('#dlg') && $('#dlg').classList.contains('show') && $('#dlgDiscard')) { $('#dlgDiscard').click(); await sleep(500); } }

  const srcIn = async (txt) => {
    document.querySelector('#modeSeg button[data-m="source"]').click();
    await sleep(400);
    $('#source').value = ($('#source').value || '') + txt;
    $('#source').dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(300);
  };

  // ---------- 场景 1：打开 CRLF 文件，不编辑 ----------
  await window.__openPath(CRLF);
  await sleep(900);
  out.openStatus = $('#stSave').textContent;
  out.eolShown = $('#stEol').textContent;
  out.dirtyOnOpen = window.__isDirty();
  await sleep(2600);                                  // 覆盖 900ms 自动保存窗口
  out.statusAfter3s = $('#stSave').textContent;
  out.dirtyAfter3s = window.__isDirty();
  step('打开后状态栏不是「已保存到文件」', !/已保存到文件/.test($('#stSave').textContent), $('#stSave').textContent);
  step('打开后不标脏', out.dirtyOnOpen === false);
  step('打开 3 秒后仍未写盘', !/已保存到文件/.test(out.statusAfter3s), out.statusAfter3s);
  step('状态栏行尾识别为 CRLF', out.eolShown === 'CRLF', out.eolShown);

  // ---------- 场景 2：编辑 CRLF 文件后保存，行尾保持 ----------
  await srcIn('追加一行 CRLF 测试\n');
  await sleep(1600);                                  // 等自动保存
  out.statusAfterEdit = $('#stSave').textContent;
  step('编辑后确实触发保存', /已保存到文件/.test($('#stSave').textContent), $('#stSave').textContent);
  step('保存后仍显示 CRLF', $('#stEol').textContent === 'CRLF', $('#stEol').textContent);

  // ---------- 场景 3：打开 LF 文件，编辑后行尾保持 LF ----------
  await window.__openPath(LF);
  await sleep(1200);
  step('LF 文件识别为 LF', $('#stEol').textContent === 'LF', $('#stEol').textContent);
  await srcIn('追加一行 LF 测试\n');
  await sleep(1600);

  out.errors = (window.__errors || []).length;
  out.errorList = (window.__errors || []).slice(0, 3);
  out.pass = out.steps.every(s => s.startsWith('✓')) && out.errors === 0;
  return out;
})();