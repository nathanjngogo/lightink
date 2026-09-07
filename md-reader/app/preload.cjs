// MD 阅读器 — 预加载桥（contextIsolation 下唯一暴露面）
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('mdr', {
  /* 文件 */
  readFile: (p) => ipcRenderer.invoke('file:read', p),
  writeFile: (p, text) => ipcRenderer.invoke('file:write', p, text),
  fileExists: (p) => ipcRenderer.invoke('file:exists', p),
  listMd: (dir) => ipcRenderer.invoke('dir:list-md', dir),
  readB64: (p) => ipcRenderer.invoke('file:read-b64', p),
  getShelf: () => ipcRenderer.invoke('shelf:get'),
  setShelf: (dir) => ipcRenderer.invoke('shelf:set', dir),
  exportSaveDialog: (defName, ext) => ipcRenderer.invoke('export:save-dialog', defName, ext),
  exportWrite: (p, html) => ipcRenderer.invoke('export:write', p, html),
  exportPrintPdf: (p, html) => ipcRenderer.invoke('export:print-pdf', p, html),
  getPathForFile: (file) => webUtils.getPathForFile(file),

  /* 最近文件 */
  listRecents: () => ipcRenderer.invoke('recents:list'),
  addRecent: (p, name) => ipcRenderer.invoke('recents:add', p, name),
  removeRecent: (p) => ipcRenderer.invoke('recents:remove', p),
  clearRecents: () => ipcRenderer.invoke('recents:clear'),

  /* 设置与阅读位置 */
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  readingAll: () => ipcRenderer.invoke('reading:all'),
  readingSet: (key, ratio) => ipcRenderer.invoke('reading:set', key, ratio),

  /* 系统对话框 */
  openFileDialog: () => ipcRenderer.invoke('sys:open-file-dialog'),
  openDirDialog: () => ipcRenderer.invoke('sys:open-dir-dialog'),
  openExternal: (url) => ipcRenderer.invoke('sys:open-external', url),

  /* 窗口控制 */
  winMin: () => ipcRenderer.invoke('win:minimize'),
  winMax: () => ipcRenderer.invoke('win:maximize'),
  winClose: () => ipcRenderer.invoke('win:close'),
  winIsMax: () => ipcRenderer.invoke('win:is-max'),
  onMaxChange: (fn) => ipcRenderer.on('win:maximized', (_e, v) => fn(v)),
  onOpenPath: (fn) => ipcRenderer.on('menu:open-path', (_e, p) => fn(p)),

  /* 环境 */
  isElectron: true,
  platform: process.platform,
});
