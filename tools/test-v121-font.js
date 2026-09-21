// v1.0.21 字体验收 F1-F7
(async () => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  const ff = el => el ? getComputedStyle(el).fontFamily.slice(0, 40) : "MISSING";
  const hit = el => { const f = ff(el); return f.startsWith('SourceHanSansCN') || (el && getComputedStyle(el).fontFamily.includes("SourceHanSansCN")); };

  await sleep(1200);
  await document.fonts.ready;

  // F1/F2 界面元素
  out.F1_brand = { ff: ff($('#titlebar .brand')), ok: hit($('#titlebar .brand')) };
  out.F2 = {};
  for (const [k, sel] of [["工具栏主题钮", "#btnTheme"], ["侧栏页签", "#tabShelf"], ["侧栏文件项", "#sideRecents .tree-item"], ["侧栏新建钮", ".side-foot button"], ["欢迎页h1", "#welcome h1"], ["欢迎页sub", "#welcome .sub"], ["主按钮", "#btnOpenFile"], ["状态栏", "#statusbar"], ["搜索框", "#btnPalette"], ["自动保存开关", "#btnAutosave"]]) {
    out.F2[k] = hit($(sel));
  }
  // 字体资源真实加载
  out.fontRes = performance.getEntriesByType('resource').filter(e => /SourceHanSansCN.*\.woff2/.test(e.name)).map(e => e.name.split('/').pop() + ' ' + (e.responseEnd > 0 ? 'ok' : 'pending'));

  // F3 编辑区（打开含标题/代码/公式的文档）
  await window.__openPath('C:/Users/1/AppData/Local/Temp/font-test.md');
  await sleep(2000);
  const pm = $('.ProseMirror');
  out.F3 = {
    prose: hit(pm),
    heading: hit($('.ProseMirror h1')),
    code: ff(document.querySelector('.ProseMirror code, .ProseMirror pre')),
    codeOk: (() => { const c = document.querySelector('.ProseMirror code, .ProseMirror pre'); return c ? getComputedStyle(c).fontFamily.includes('SourceHanSansCN') : 'no-code'; })(),
    crepeVarDefault: pm ? getComputedStyle(pm.closest('.milkdown') || pm).getPropertyValue('--crepe-font-default').trim().slice(0, 40) : null
  };

  // F7 KaTeX
  const katexEl = document.querySelector('.katex');
  out.F7 = { present: !!katexEl, ff: katexEl ? getComputedStyle(katexEl).fontFamily.slice(0, 40) : 'no katex' };

  // F6 中文回退判别：同段文本两种字体宽度对比
  const t = '轻墨思源黑体验收';
  const mk = fam => { const s = document.createElement('span'); s.style.cssText = 'position:fixed;top:-999px;font-size:32px;visibility:hidden;font-family:' + fam; s.textContent = t; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; };
  const wSH = mk('"SourceHanSansCN"'), wSong = mk('"SimSun"'), wYahei = mk('"Microsoft YaHei UI"');
  out.F6 = { wSH: Math.round(wSH), wSimSun: Math.round(wSong), wYahei: Math.round(wYahei),
             notSong: Math.abs(wSH - wSong) > 2, notYahei: Math.abs(wSH - wYahei) > 2 || wSH === wYahei };

  // F4 精确
  out.F4 = { check16: document.fonts.check('16px SourceHanSansCN'), check700: document.fonts.check('700 16px SourceHanSansCN'), status: document.fonts.status };

  // F5 深色主题复测（点主题按钮切到 dark，测完切回 auto）
  const startTheme = document.documentElement.dataset.theme;
  for (let i = 0; i < 3 && document.documentElement.dataset.theme !== 'dark'; i++) {
    $('#btnTheme').click(); await sleep(350);
  }
  out.F5 = { theme: document.documentElement.dataset.theme, brandStill: hit($('#titlebar .brand')),
             codeStill: (() => { const c = document.querySelector('.ProseMirror code, .ProseMirror pre'); return c ? getComputedStyle(c).fontFamily.includes('SourceHanSansCN') : null; })() };
  for (let i = 0; i < 3 && document.documentElement.dataset.theme !== startTheme; i++) {
    $('#btnTheme').click(); await sleep(300);
  }

  out.errors = (window.__errors || []).length;
  return out;
})();