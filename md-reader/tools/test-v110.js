// 验证 pickDir 新逻辑（跳过原生对话框）：模拟选目录后的处理链
(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 用一个真实目录直接走导入链（等价于 pickDir 选完目录后的部分）
  const dir = 'C:/Users/1/Documents/ChatGPT/软件开发/md-reader/docs';
  const { files } = await window.mdr.listMd(dir);
  out.listFiles = files.map(f => f.name);
  const fname = dir.split(/[\\/]/).filter(Boolean).pop();
  out.folderName = fname;
  const fid = await window.mdr.shelfFolderAdd(fname);
  out.fid = fid;
  for (const f of files) { if (f && f.path) await window.mdr.shelfFileAdd(fid, f.path); }
  await window.__renderShelfData();
  await new Promise(r=>setTimeout(r,400));
  // 验证书架 UI 出现该文件夹及文件
  const shelfText = document.querySelector('#realFiles').textContent;
  out.shelfHasFolder = shelfText.includes(fname);
  out.shelfHasFile = files.length ? shelfText.includes(files[0].name) : 'no-files';
  out.shelfCount = (shelfText.match(/使用说明书/g)||[]).length;
  // 持久层验证
  const data = await window.mdr.shelfData();
  const folder = data.folders.find(x => x.id === fid);
  out.persistedFiles = folder ? folder.files.length : 'folder-not-found';
  out.persistedFirst = folder && folder.files[0] ? folder.files[0].path : null;
  // 清理：删除测试文件夹
  await window.mdr.shelfFolderRemove(fid);
  await window.__renderShelfData();
  out.errs = window.__errors;
  return out;
})()
