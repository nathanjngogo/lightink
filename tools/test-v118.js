// v1.0.18 端到端验证：切换文档时保存提示（真实场景，自动保存关闭以保证脏窗口稳定）
(async () => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { steps: [] };
  const step = (n, ok) => { out.steps.push(`${ok ? '✓' : '✗'} ${n}`); return ok; };
  const dlgShown = () => $('#dlg').classList.contains('show');
  const docText = () => ($('#editor').textContent || '') + ' ' + ($('#source').value || '');
  const dir = 'C:/Users/1/Documents/ChatGPT/软件开发/tools';
  const fA = dir + '/test-switch-a.md', fB = dir + '/test-switch-b.md';

  // 在文档里制造一次真实修改：优先所见即所得模式，失败则回退源码模式
  const typeIn = async (txt) => {
    document.querySelector('#modeSeg button[data-m="edit"]').click();
    await sleep(450);
    let pm = document.querySelector('#editor .ProseMirror');
    if (pm) { pm.click(); pm.focus(); document.execCommand('insertText', false, txt); await sleep(300); }
    if (((pm && pm.textContent) || '').includes(txt)) return 'edit';
    document.querySelector('#modeSeg button[data-m="source"]').click();
    await sleep(450);
    $('#source').value = ($('#source').value || '') + txt;
    $('#source').dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(300);
    return ($('#source').value || '').includes(txt) ? 'source' : 'fail';
  };

  await window.mdr.writeFile(fA, '# 文档A\n\n第一个文档内容。\n');
  await window.mdr.writeFile(fB, '# 文档B\n\n第二个文档内容。\n');

  // 关闭自动保存
  if ($('#setAutosave').getAttribute('aria-checked') === 'true') { $('#setAutosave').click(); await sleep(250); }
  step('自动保存已关闭（脏窗口稳定）', $('#setAutosave').getAttribute('aria-checked') === 'false');

  // 1) 打开 A：阅读模式、无脏
  await window.__openPath(fA); await sleep(900);
  step('打开A为阅读模式', document.body.dataset.mode === 'read');
  step('打开A无未保存修改', window.__isDirty() === false);

  // 2) 无修改时切 B：不弹窗，内容正确加载（回归 text:'' 空文档 bug）
  await window.__openPath(fB); await sleep(700);
  step('无修改切换不弹窗', !dlgShown());
  step('B内容已正确加载', docText().includes('第二个文档内容'));

  // 3) 编辑 B
  step('B编辑已生效', (await typeIn('改动B')) !== 'fail');
  step('B编辑后判定为脏', window.__isDirty() === true);

  // 4) 打开 A → 弹三选项
  const p1 = window.__openPath(fA); await sleep(600);
  step('有未保存修改时切换弹窗', dlgShown());
  step('弹窗标题正确', $('#dlgTitle').textContent.includes('未保存'));
  step('弹窗三按钮齐备', !!$('#dlgCancel') && !!$('#dlgDiscard') && !!$('#dlgOk'));
  $('#dlgCancel').click(); await sleep(500); await p1.catch(() => {});
  step('取消后留在B', $('#docTitleText').textContent === 'test-switch-b.md');
  step('取消后B内容未丢失', docText().includes('改动B'));

  // 5) 再次打开 A → 不保存
  const p2 = window.__openPath(fA); await sleep(600);
  step('再次弹窗', dlgShown());
  $('#dlgDiscard').click(); await sleep(1000); await p2.catch(() => {});
  step('不保存后打开A', $('#docTitleText').textContent === 'test-switch-a.md');
  step('A内容完整', docText().includes('第一个文档内容'));
  const bDisk = await window.mdr.readFile(fB);
  step('放弃的修改未写入B', !bDisk.text.includes('改动B'));

  // 6) 编辑 A → 打开 B → 保存：验证真正落盘
  step('A编辑已生效', (await typeIn('已保存改动')) !== 'fail');
  step('A编辑后判定为脏', window.__isDirty() === true);
  const p3 = window.__openPath(fB); await sleep(600);
  step('保存分支弹窗出现', dlgShown());
  $('#dlgOk').click(); await sleep(1500); await p3.catch(() => {});
  step('保存后打开B', $('#docTitleText').textContent === 'test-switch-b.md');
  const aDisk = await window.mdr.readFile(fA);
  step('A的修改已真正落盘', aDisk.text.includes('已保存改动'));
  step('切换后脏状态复位', window.__isDirty() === false);

  // 7) 新建文档前的守卫
  step('B再编辑已生效', (await typeIn('再改B')) !== 'fail');
  const p4 = (async () => { await window.__createNewDoc(); })().catch(() => {});
  await sleep(600);
  step('新建文档前弹保存询问', dlgShown());
  $('#dlgCancel').click(); await sleep(400); await p4;
  step('取消后留在B且未新建', $('#docTitleText').textContent === 'test-switch-b.md');

  // 恢复自动保存
  $('#setAutosave').click(); await sleep(250);

  out.errors = (window.__errors || []).filter(e => !/reading 'extension'/i.test(String(e)));
  out.pass = out.steps.every(s => s.startsWith('✓')) && out.errors.length === 0;
  return out;
})();