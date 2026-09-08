(async () => {
  window.__pdfres = 'pending';
  try {
    await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/pdf-test.md');
    await new Promise(r => setTimeout(r, 1800));
    const html = await window.__buildExportHtml();
    await window.mdr.exportPrintPdf('C:/Users/1/AppData/Local/Temp/lightink-test.pdf', html);
    window.__pdfres = { ok: true, htmlSize: html.length };
  } catch (e) {
    window.__pdfres = { err: String(e.message || e).slice(0, 300) };
  }
})()
