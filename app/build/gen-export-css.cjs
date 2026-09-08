// 生成导出用自包含 KaTeX CSS：字体转 data URI（仅 woff2，Chromium 打包版与外部浏览器均支持）
// 输出: app/renderer/vendor/katex-export.css
const fs = require('node:fs');
const path = require('node:path');

const KATEX = path.resolve(__dirname, '../../vendor-src/node_modules/katex/dist');
const css = fs.readFileSync(path.join(KATEX, 'katex.min.css'), 'utf8');

const out = css.replace(/url\((fonts\/[^)]+\.woff2)\)/g, (_m, rel) => {
  const font = fs.readFileSync(path.join(KATEX, rel));
  return `url(data:font/woff2;base64,${font.toString('base64')})`;
});
// 移除 woff/ttf 引用行（woff2 已内联，避免外部依赖）
const cleaned = out.replace(/url\(fonts\/[^)]+\.woff2?\)[^;}]*;?/g, m => m.includes('data:') ? m : ';');

fs.writeFileSync(path.join(__dirname, '../renderer/vendor/katex-export.css'), cleaned);
console.log('katex-export.css:', (cleaned.length / 1024).toFixed(0) + 'KB, data-uri fonts:',
  (cleaned.match(/data:font\/woff2/g) || []).length);
