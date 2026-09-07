(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 1) 打开文档 → 大纲有内容
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md');
  await new Promise(r => setTimeout(r, 1800));
  out.outlineItemsBefore = document.querySelectorAll('#outlinePane .ol-item').length;
  out.countBefore = $('#stCount').textContent;
  // 2) 关闭文档（回到主页）
  window.__closeDoc();
  await new Promise(r => setTimeout(r, 300));
  out.backToWelcome = !document.body.hasAttribute('data-doc-open');
  out.outlineItemsAfter = document.querySelectorAll('#outlinePane .ol-item').length;
  out.outlineEmptyMsg = $('#outlinePane').textContent.includes('打开文档后');
  out.countAfter = $('#stCount').textContent;
  out.saveAfter = $('#stSave').textContent;
  out.titleAfter = $('#docTitle').textContent;
  out.editorCleared = document.querySelector('#editor').children.length === 0;
  out.crepeDestroyed = window.__crepeGone !== false;
  // 3) 重新打开文档 → 一切恢复正常
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await new Promise(r => setTimeout(r, 1500));
  out.reopenOutline = document.querySelectorAll('#outlinePane .ol-item').length;
  out.reopenPM = !!document.querySelector('.ProseMirror');
  out.reopenEditable = document.querySelector('.ProseMirror')?.getAttribute('contenteditable');
  out.reopenCount = $('#stCount').textContent;
  out.errs = window.__errors;
  return out;
})()
