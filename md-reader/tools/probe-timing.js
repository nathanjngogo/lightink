(async () => {
  const P = 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md';
  await window.mdr.readingSet(P, null);
  await window.__openPath(P);
  const pane = document.querySelector('#editorPane');
  const samples = [];
  for (let i = 1; i <= 6; i++) {
    await new Promise(r => setTimeout(r, 250));
    samples.push({ t: i * 250, max: pane.scrollHeight - pane.clientHeight, top: pane.scrollTop });
  }
  return samples;
})()
