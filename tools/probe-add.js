(async () => {
  const id = await window.mdr.shelfFolderAdd('验证分类');
  await window.mdr.shelfFileAdd(id, 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/test-doc.md');
  await window.mdr.shelfFileAdd(id, 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/assoc-test.md');
  const d = await window.mdr.shelfData();
  const f = d.folders.find(x => x.id === id);
  await window.mdr.shelfFolderRemove(id);
  return { files: f.files.length };
})()