// MD 阅读器 — Electron 主进程
const { app, BrowserWindow, ipcMain, shell, dialog, protocol, net } = require('electron');
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
  win.focus();
  const file = pickFileArg(argv);
  if (file) {
    win.webContents.send('menu:open-path', file);
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
  const list = loadRecents().filter(r => r.path !== p);
  list.unshift({ path: p, name, ts: Date.now() });
  saveRecents(list);
  app.addRecentDocument(p);
}
function pickFileArg(argv) {
  for (const a of argv) {
    if (/\.md$/i.test(a) && fs.existsSync(a)) return path.resolve(a);
  }
  return null;
}

/* ---------- 窗口 ---------- */
let win = null;
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
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('menu:open-path', startFile);
    });
  }
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
  ipcMain.handle('dir:list-md', async (_e, p) => {
    const dir = path.resolve(String(p));
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      if (e.isFile() && /\.(md|markdown)$/i.test(e.name)) {
        const full = path.join(dir, e.name);
        const st = await fsp.stat(full).catch(() => null);
        out.push({ name: e.name, path: full, mtime: st ? st.mtimeMs : 0 });
      }
    }
    return { dir, files: out };
  });
  ipcMain.handle('recents:list', () => loadRecents());
  ipcMain.handle('recents:add', (_e, p, name) => { addRecent(p, name); return true; });
  ipcMain.handle('recents:clear', () => { saveRecents([]); return true; });

  ipcMain.handle('sys:open-file-dialog', async () => {
    const r = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
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
});
app.on('window-all-closed', () => app.quit());
