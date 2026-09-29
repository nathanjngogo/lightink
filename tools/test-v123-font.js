// v1.0.23 字体收口核验：所有 font-family 必须落在思源/Noto 栈，0 系统字体残留
(async () => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await document.fonts.ready;
  const probes = [
    ['--font 变量', getComputedStyle(document.documentElement).getPropertyValue('--font').trim()],
    ['--mono 变量', getComputedStyle(document.documentElement).getPropertyValue('--mono').trim()],
    ['brand', getComputedStyle($('.brand')).fontFamily],
    ['侧栏项', getComputedStyle($('.side-item') || $('.p-item') || $('aside')).fontFamily],
    ['搜索按钮', getComputedStyle($('#btnPalette')).fontFamily],
    ['关闭按钮', getComputedStyle($('#btnCloseDoc')).fontFamily],
    ['正文', getComputedStyle($('.ProseMirror')).fontFamily],
    ['代码块', getComputedStyle($('#editorWrap pre') || $('#source')).fontFamily],
  ];
  // 判别法：思源 vs 系统字体宽度差
  const mk = fam => { const s = document.createElement('span'); s.textContent = '轻墨测试LightInk'; s.style.cssText = `font-size:48px;font-family:${fam};position:absolute;left:-9999px`; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return Math.round(w); };
  return {
    probes,
    hanInAll: probes.slice(1).every(([, f]) => /SourceHanSansCN|Source Han Sans CN|Noto Sans/.test(f)),
    leak: probes.filter(([, f]) => /MiSans|HarmonyOS|PingFang|Segoe|Cascadia|JetBrains|Consolas|monospace$/.test(f) && !/SourceHanSansCN|Source Han Sans CN|Noto Sans/.test(f)).map(([n]) => n),
    width: { bundled: mk('"SourceHanSansCN"'), noto: mk('"Noto Sans CJK SC"'), yahei: mk('"Microsoft YaHei"'), song: mk('SimSun') },
    fontStatus: document.fonts.status,
    errors: (window.__errors || []).length
  };
})()
