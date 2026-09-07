// MD 阅读器 — Electron 主进程
const { app, BrowserWindow, ipcMain, shell, dialog, protocol, net , Tray, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = fs.promises;

const isDev = !app.isPackaged;
const ROOT = path.join(__dirname, 'renderer');

/* ---------- app:// 协议：必须在 app ready 前声明 ---------- */
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

/* ---------- 单实例锁：双击 .md 时新文件送到已开窗口 ---------- */
if (!app.requestSingleInstanceLock()) {
  app.quit();
}
app.on('second-instance', (_e, argv) => {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();   // 托盘隐藏中：双击关联文件/再次启动 → 自动唤回界面
  win.focus();
  const file = pickFileArg(argv);
  if (file) {
    // 第二实例冷启动时渲染层监听可能尚未注册，同样握手+重试
    let delivered = false;
    win.webContents.on('ipc-message', (_e, ch) => { if (ch === 'open-path:acked') delivered = true; });
    const push = () => { if (!delivered) win.webContents.send('menu:open-path', file); };
    push();
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      if (delivered || n >= 10) { clearInterval(timer); return; }
      push();
    }, 600);
    addRecent(file, path.basename(file));
  }
});

/* ---------- 最近文件（主进程持久化） ---------- */
const RECENT_MAX = 12;
const recentsPath = () => path.join(app.getPath('userData'), 'recent.json');
function loadRecents() {
  try { return JSON.parse(fs.readFileSync(recentsPath(), 'utf8')); } catch { return []; }
}
function saveRecents(list) {
  try {
    fs.mkdirSync(path.dirname(recentsPath()), { recursive: true });
    fs.writeFileSync(recentsPath(), JSON.stringify(list.slice(0, RECENT_MAX), null, 2));
  } catch { /* 磁盘异常时静默，最近文件非关键数据 */ }
}
function addRecent(p, name) {
  if (!p) return;
  p = path.resolve(String(p));
  const list = loadRecents().filter(r => path.resolve(r.path) !== p);
  list.unshift({ path: p, name, ts: Date.now() });
  saveRecents(list);
  app.addRecentDocument(p);
}
function pickFileArg(argv) {
  for (const a of argv) {
    if (/\.(md|markdown|txt)$/i.test(a) && fs.existsSync(a)) return path.resolve(a);
  }
  return null;
}

/* ---------- 设置（书架目录等，userData/settings.json） ---------- */
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');
function loadSettings() {
  try { return Object.assign({ closeAction: 'ask' }, JSON.parse(fs.readFileSync(settingsPath(), 'utf8'))); } catch { return { closeAction: 'ask' }; }
}
function saveSettings(patch) {
  const merged = Object.assign(loadSettings(), patch);
  try {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.writeFileSync(settingsPath(), JSON.stringify(merged, null, 2));
  } catch { /* 设置写入失败静默 */ }
  return merged;
}


/* ---------- 书架（可管理：分类文件夹 + 关联文件） ---------- */
const shelfRoot = () => path.join(app.getPath('userData'), 'shelf');
function shelfMetaPath() { return path.join(shelfRoot(), 'shelf.json'); }
function loadShelfData() {
  try {
    const d = JSON.parse(fs.readFileSync(shelfMetaPath(), 'utf8'));
    if (Array.isArray(d.folders)) return d;
  } catch {}
  // 迁移旧版单目录书架
  const legacy = loadShelf();
  return { folders: legacy ? [{ id: 'f' + Date.now(), name: '我的书架', files: [] }] : [] };
}
function saveShelfData(d) {
  fs.mkdirSync(shelfRoot(), { recursive: true });
  fs.writeFileSync(shelfMetaPath(), JSON.stringify(d, null, 2));
}

/* ---------- 窗口 ---------- */
let win = null;
let tray = null;
function createWindow(startFile) {
  win = new BrowserWindow({
    width: 1280, height: 840, minWidth: 860, minHeight: 600,
    frame: false,               // 无边框 → 自绘标题栏
    show: false,
    backgroundColor: '#fdfdfb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,   // 安全：渲染层无法直接碰 Node
      nodeIntegration: false,
      sandbox: false,           // preload 需要走 IPC 桥
      spellcheck: false,
    },
  });
  win.on('close', (e) => {
    if (app.quitting) return;              // 真退出：放行
    const act = loadSettings().closeAction;
    if (act === 'exit') return;            // 用户选过「退出」：放行
    e.preventDefault();
    if (act === 'tray') { win.hide(); return; }
    win.webContents.send('win:close-ask'); // 默认 ask：渲染层弹三选对话框
  });

  win.once('ready-to-show', () => win.show());
  win.on('maximize', () => win.webContents.send('win:maximized', true));
  win.on('unmaximize', () => win.webContents.send('win:maximized', false));

  // 外部链接走系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });

  win.loadURL('app://local/index.html');

  if (startFile) {
    // 渲染层模块顶层有异步 import（Crepe 加载），open-path 监听注册可能晚于 did-finish-load。
    // 采用握手 + 重试：渲染层 ready 后立即发；否则每 700ms 重试至多 5 次。
    let delivered = false;
    win.webContents.on('ipc-message', (_e, ch) => { if (ch === 'open-path:acked') delivered = true; });
    const push = () => { if (!delivered) win.webContents.send('menu:open-path', startFile); };
    win.webContents.once('did-finish-load', () => {
      push();
      let n = 0;
      const timer = setInterval(() => {
        n += 1;
        if (delivered || n >= 10) { clearInterval(timer); return; }
        push();
      }, 600);
    });
  }
}

/* ---------- 书架目录（主进程持久化，启动自动恢复） ---------- */
const shelfPath = () => path.join(app.getPath('userData'), 'shelf.json');
function loadShelf() {
  try { return JSON.parse(fs.readFileSync(shelfPath(), 'utf8')).dir || null; } catch { return null; }
}
function saveShelf(dir) {
  try {
    fs.mkdirSync(path.dirname(shelfPath()), { recursive: true });
    fs.writeFileSync(shelfPath(), JSON.stringify({ dir }, null, 2));
  } catch {}
}

/* ---------- IPC ---------- */
function registerIpc() {
  ipcMain.handle('file:read', async (_e, p) => {
    const resolved = path.resolve(String(p));
    const stat = await fsp.stat(resolved);
    if (!stat.isFile()) throw new Error('not a file');
    const bytes = await fsp.readFile(resolved);
    return { name: path.basename(resolved), path: resolved, text: bytes.toString('utf8'), mtime: stat.mtimeMs };
  });
  ipcMain.handle('file:write', async (_e, p, text) => {
    const resolved = path.resolve(String(p));
    await fsp.writeFile(resolved, resolved.endsWith('.txt') ? String(text) : String(text), 'utf8');
    return { ok: true, mtime: (await fsp.stat(resolved)).mtimeMs };
  });
  ipcMain.handle('file:exists', async (_e, p) => {
    try { const s = await fsp.stat(path.resolve(String(p))); return s.isFile() || s.isDirectory(); }
    catch { return false; }
  });
  ipcMain.handle('file:read-b64', async (_e, p) => {
    const resolved = path.resolve(String(p));
    const ext = path.extname(resolved).toLowerCase();
    const mime = ({ '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml', '.webp':'image/webp' })[ext];
    if (!mime) throw new Error('unsupported image type');
    const data = await fsp.readFile(resolved);
    return { mime, data: data.toString('base64') };
  });
  ipcMain.handle('dir:list-md', async (_e, p) => {
    const dir = path.resolve(String(p));
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      if (e.isFile() && /\.(md|markdown|txt)$/i.test(e.name)) {
        const full = path.join(dir, e.name);
        const st = await fsp.stat(full).catch(() => null);
        out.push({ name: e.name, path: full, mtime: st ? st.mtimeMs : 0 });
      }
    }
    return { dir, files: out };
  });
  ipcMain.handle('recents:list', () => loadRecents());
  ipcMain.handle('recents:add', (_e, p, name) => { addRecent(p, name); return true; });
  ipcMain.handle('recents:remove', (_e, p) => {
    const target = path.resolve(String(p));
    saveRecents(loadRecents().filter(r => path.resolve(r.path) !== target));
    return true;
  });
  ipcMain.handle('recents:clear', () => { saveRecents([]); return true; });

  ipcMain.handle('settings:get', () => loadSettings());
  ipcMain.handle('settings:set', (_e, patch) => saveSettings(patch || {}));
  ipcMain.handle('reading:all', () => loadSettings().reading || {});
  ipcMain.handle('reading:set', (_e, key, ratio) => {
    const s = loadSettings();
    s.reading = s.reading || {};
    if (ratio == null) delete s.reading[key]; else s.reading[key] = ratio;
    try {
      fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
      fs.writeFileSync(settingsPath(), JSON.stringify(s, null, 2));
    } catch {}
    return true;
  });

  ipcMain.handle('export:save-dialog', async (_e, defName, ext) => {
    const r = await dialog.showSaveDialog(win, {
      defaultPath: defName,
      filters: ext === 'pdf'
        ? [{ name: 'PDF 文档', extensions: ['pdf'] }]
        : [{ name: 'HTML 文档', extensions: ['html'] }],
    });
    return r.canceled ? null : r.filePath;
  });
  ipcMain.handle('export:write', async (_e, p, html) => {
    await fsp.writeFile(String(p), String(html), 'utf8');
    return true;
  });
  ipcMain.handle('export:print-pdf', async (_e, p, html) => {
    const tmp = path.join(app.getPath('temp'), `lightink-print-${Date.now()}.html`);
    await fsp.writeFile(tmp, String(html), 'utf8');
    const pw = new BrowserWindow({
      show: false,
      // offscreen 渲染：不占用显示合成器，printToPDF 更稳定
      webPreferences: { sandbox: true, contextIsolation: true, offscreen: true },
      width: 900, height: 1200,
    });
    // 整体 60s 超时保护，避免任何阶段挂死
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('PDF 生成超时')), 60000));
    try {
      await Promise.race([
        (async () => {
          await pw.loadFile(tmp);
          await new Promise(r => setTimeout(r, 700)); // 等待 KaTeX/布局稳定
          const data = await pw.webContents.printToPDF({
            pageSize: 'A4', printBackground: true,
            margins: { top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 },
          });
          await fsp.writeFile(String(p), data);
        })(),
        timeout,
      ]);
      return true;
    } finally {
      try { pw.destroy(); } catch {}
      fsp.unlink(tmp).catch(() => {});
    }
  });

  ipcMain.handle('shelf:data', () => loadShelfData());
  ipcMain.handle('shelf:folder-add', (_e, name) => {
    const d = loadShelfData();
    const id = 'f' + Date.now();
    d.folders.push({ id, name: String(name).slice(0, 40), files: [] });
    saveShelfData(d);
    return id;
  });
  ipcMain.handle('shelf:folder-rename', (_e, id, name) => {
    const d = loadShelfData();
    const f = d.folders.find(x => x.id === id);
    if (f) f.name = String(name).slice(0, 40);
    saveShelfData(d);
    return true;
  });
  ipcMain.handle('shelf:folder-remove', (_e, id) => {
    const d = loadShelfData();
    d.folders = d.folders.filter(x => x.id !== id);
    saveShelfData(d);
    return true;
  });
  ipcMain.handle('shelf:file-add', (_e, id, p) => {
    const d = loadShelfData();
    const f = d.folders.find(x => x.id === id);
    if (!f) return false;
    const rp = path.resolve(String(p));
    if (!f.files.some(x => path.resolve(x.path) === rp)) {
      f.files.push({ path: rp, name: path.basename(rp) });
    }
    saveShelfData(d);
    return true;
  });
  ipcMain.handle('shelf:file-remove', (_e, id, p) => {
    const d = loadShelfData();
    const f = d.folders.find(x => x.id === id);
    if (f) f.files = f.files.filter(x => path.resolve(x.path) !== path.resolve(String(p)));
    saveShelfData(d);
    return true;
  });
  ipcMain.handle('shelf:read-files', async (_e, paths) => {
    const out = [];
    for (const p of paths) {
      try {
        const rp = path.resolve(String(p));
        const st = await fsp.stat(rp);
        if (st.isFile() && /\.(md|markdown|txt)$/i.test(rp)) {
          out.push({ name: path.basename(rp), path: rp, mtime: st.mtimeMs });
        }
      } catch {}
    }
    return out;
  });
  ipcMain.handle('doc:create', async (_e, name, dir) => {
    // 新建 md：写入目标目录（默认「文档」），重名自动加序号
    let target = path.join(dir || app.getPath('documents'), name);
    const ext = path.extname(name) || '.md';
    const base = target.slice(0, -ext.length);
    let i = 1;
    while (fs.existsSync(target)) target = `${base}-${i++}${ext}`;
    await fsp.writeFile(target, `# ${path.basename(target, ext)}\n\n`, 'utf8');
    return target;
  });
  ipcMain.handle('shelf:get', () => loadShelf());
  ipcMain.handle('shelf:set', (_e, dir) => { saveShelf(dir); return true; });

  ipcMain.handle('sys:open-file-dialog', async () => {
    const r = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Markdown / Text', extensions: ['md', 'markdown', 'txt'] }],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    const p = r.filePaths[0];
    addRecent(p, path.basename(p));
    return p;
  });
  ipcMain.handle('sys:open-dir-dialog', async () => {
    const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths[0]) return null;
    return r.filePaths[0];
  });
  ipcMain.handle('sys:open-external', (_e, url) => {
    if (/^https?:/i.test(String(url))) shell.openExternal(String(url));
  });

  ipcMain.handle('win:minimize', () => win && win.minimize());
  ipcMain.handle('win:maximize', () => { if (win) win.isMaximized() ? win.unmaximize() : win.maximize(); });
  ipcMain.handle('win:close', () => win && win.close());
ipcMain.handle('win:is-hidden', () => { const w = BrowserWindow.getAllWindows()[0]; return w ? w.isVisible() === false : false; });
ipcMain.handle('win:tray-show', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { w.show(); w.focus(); } return true; });
ipcMain.handle('win:close-choice', (_e, choice, remember) => {
  if (choice === 'cancel') return 'stayed';
  if (remember) saveSettings({ closeAction: choice });   // 'tray' | 'exit'
  const w = BrowserWindow.getAllWindows()[0];
  if (!w) return 'gone';
  if (choice === 'tray') { w.hide(); return 'hidden'; }
  app.quitting = true; app.quit(); return 'quitting';
});
  ipcMain.handle('win:is-max', () => (win ? win.isMaximized() : false));
}

/* ---------- 生命周期 ---------- */
app.whenReady().then(() => {
  // app://local/* → renderer 目录
  protocol.handle('app', (request) => {
    const { hostname, pathname } = new URL(request.url);
    if (hostname !== 'local') return new Response('not found', { status: 404 });
    const rel = decodeURIComponent(pathname.replace(/^\//, ''));
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT)) return new Response('forbidden', { status: 403 });
    return net.fetch('file:///' + file.split(path.sep).join('/'));
  });

  registerIpc();
  createWindow(pickFileArg(process.argv));
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // 常驻托盘
  const { nativeImage } = require('electron');
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'renderer', 'assets', 'tray.png'));
  tray = new Tray(trayIcon);
  tray.setToolTip('LightInk 轻墨');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { w.show(); w.focus(); } else createWindow(); } },
    { label: '退出 LightInk', click: () => { app.quitting = true; app.quit(); } },
  ]));
  tray.on('double-click', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { w.show(); w.focus(); } });
});
app.on('before-quit', () => { app.quitting = true; });
app.on('window-all-closed', () => {
  // 托盘常驻：窗口全关（隐藏也算）不退出；仅真退出链路走 before-quit
  if (app.quitting) app.quit();
});
