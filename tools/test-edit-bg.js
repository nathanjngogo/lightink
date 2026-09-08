(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r => setTimeout(r, 1500));
  const pane = $('#editorPane');
  // 阅读模式背景
  document.body.dataset.mode = 'read';
  await new Promise(r => setTimeout(r, 200));
  out.readBg = getComputedStyle(pane).backgroundColor;
  // 编辑模式背景
  document.body.dataset.mode = 'edit';
  await new Promise(r => setTimeout(r, 200));
  out.editBg = getComputedStyle(pane).backgroundColor;
  out.bgDiffers = out.readBg !== out.editBg;
  // 源码模式保持原底色
  document.body.dataset.mode = 'source';
  await new Promise(r => setTimeout(r, 200));
  out.srcBg = getComputedStyle($('#sourcePane')).backgroundColor;
  document.body.dataset.mode = 'read';
  out.errs = window.__errors;
  return out;
})()
