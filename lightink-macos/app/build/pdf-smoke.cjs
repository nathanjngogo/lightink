// 无 CDP 的 PDF 管线验证：直接用独立隐藏 BrowserWindow 调 printToPDF，
// 不经过渲染层/IPC，验证 printToPDF 在本机是否可用（排除 CDP 因素后）。
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.whenReady().then(async () => {
  const tmp = path.join(app.getPath('temp'), 'lightink-smoke.html');
  fs.writeFileSync(tmp, '<h1>PDF smoke</h1><p>LightInk export test</p>', 'utf8');
  const pw = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true, offscreen: true },
    width: 900, height: 1200,
  });
  try {
    await pw.loadFile(tmp);
    await new Promise(r => setTimeout(r, 700));
    const data = await Promise.race([
      pw.webContents.printToPDF({ pageSize: 'A4', printBackground: true }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 30s')), 30000)),
    ]);
    fs.writeFileSync('C:/Users/1/AppData/Local/Temp/lightink-direct.pdf', data);
    console.log('PDF_OK', data.length);
  } catch (e) {
    console.log('PDF_FAIL', String(e.message).slice(0, 200));
  } finally {
    try { pw.destroy(); } catch {}
    app.quit();
  }
});
