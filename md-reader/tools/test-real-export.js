// 真实导出测试：不 stub 冻结桥，直接走完整 doExport 流程（saveDialog 会弹系统对话框，
// 但 print/write 目标固定 → 无法绕过 UI）。改为验证 buildExportHtml + exportWrite 组合，
// 以及菜单关闭逻辑本身（944 行）已由代码审读确认在 await exportSaveDialog 之后执行。
// 这里做 HTML 导出的「真实写盘」验证：临时 hook 页面内按钮不可行 →
// 直接调 window.__buildExportHtml 并用 window.mdr.exportWrite 写盘（exportWrite 是原生桥）。
(async () => {
  window.__res = 'pending';
  try {
    const html = await window.__buildExportHtml();
    const target = 'C:/Users/1/AppData/Local/Temp/lightink-real-export.html';
    await window.mdr.exportWrite(target, html);
    window.__res = { ok: true, size: html.length, target };
  } catch (e) {
    window.__res = { err: String(e.message || e).slice(0, 200) };
  }
})()
