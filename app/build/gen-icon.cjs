// 零依赖图标生成 v3 —— 像素风斜体 L（p1-extrude 定稿）
// 设计：白色圆角底板（#FFFFFF→#F7F8FA 竖向渐变）+ 黑色斜体像素 L（#1C1E21）
//       + 右下 3 层灰色挤出阴影（t=1..3）
// 实现：同一份设计按任意 S 直接参数化绘制（比例随 S 缩放），不做位图缩放重采样。
// 输出：
//   build/icon.png(256 RGBA) + build/icon-16..256.png（7 个单尺寸 RGBA）
//   build/icon.ico（多尺寸 16/24/32/48/64/128/256，7 条目，每项一张 PNG）
//   renderer/brand.png(256 RGB 无透明) + renderer/assets/tray.png(32 RGB)
const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');

/* ---------- §0 字形网格（16×16，高位=左，1=黑格，行 r/列 c: (MASK[r] >> (15-c)) & 1） ---------- */
const MASK = [
  0x0000, 0x0000, 0x0000, 0x0700, 0x0700, 0x0700, 0x0700,
  0x0E00, 0x0E00, 0x0E00, 0x0E00, 0x1C00, 0x1FE0, 0x1FE0,
  0x0000, 0x0000,
];
const GLYPH_TOP = 3;    // 有效行 3..13 → 11 行
const GLYPH_ROWS = 11;
const GLYPH_LEFT = 3;   // 有效列 3..10 → 8 列
const GLYPH_COLS = 8;

/* ---------- §0 颜色 ---------- */
const BOARD_TOP = [0xff, 0xff, 0xff];
const BOARD_BOT = [0xf7, 0xf8, 0xfa];
const L_COLOR = [0x1c, 0x1e, 0x21];
// 挤出三层：t=1 最内（贴 L 主体）→ t=3 最外；灰阶随层数渐深
const SHADE = { 1: [0xe2, 0xe4, 0xe8], 2: [0xd5, 0xd8, 0xdd], 3: [0xc8, 0xcc, 0xd2] };

/* ---------- §0 布局比例 ---------- */
const CONTENT_RATIO = 0.72;  // 字形+阴影整体高占底板
const CORNER_RATIO = 0.225;  // 圆角半径 = S × 0.225
const RISE_RATIO = 0.01;     // 居中后上移 1%
const SOFT_SHADOW_RATIO = 0.25; // 方块外柔影：黑 25%
const SS = 4;                // 圆角抗锯齿超采样

const OUTPUT_SIZES = [16, 24, 32, 48, 64, 128, 256];
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** 字形判定：col/row 为字形局部格坐标（0,0 = mask 行 3 / 列 3） */
function maskAt(col, row) {
  const r = row + GLYPH_TOP;
  const c = col + GLYPH_LEFT;
  if (r < 0 || r > 15 || c < 0 || c > 15) return 0;
  return (MASK[r] >> (15 - c)) & 1;
}

/** 按 S 换算全部比例参数 */
function metrics(S) {
  const layers = S <= 32 ? 1 : 3;                       // 小图合并为 1 层
  const cell = Math.max(1, Math.round((S * CONTENT_RATIO) / (GLYPH_ROWS + 3)));
  const contentW = (GLYPH_COLS + layers) * cell;
  const contentH = (GLYPH_ROWS + layers) * cell;
  const ox = Math.round((S - contentW) / 2);
  const oy = Math.round((S - contentH) / 2 - S * RISE_RATIO);
  const rr = Math.min(S / 2, S * CORNER_RATIO);
  return { layers, cell, ox, oy, rr, contentW, contentH };
}

function inRoundRect(x, y, w, h, r) {
  const cx = clamp(x, r, w - r);
  const cy = clamp(y, r, h - r);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** 圆角矩形有符号距离（内部为负） */
function sdRoundRect(px, py, w, h, r) {
  const qx = Math.abs(px - w / 2) - (w / 2 - r);
  const qy = Math.abs(py - h / 2) - (h / 2 - r);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function boardCoverage(x, y, S, rr) {
  let hit = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      if (inRoundRect(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS, S, S, rr)) hit++;
    }
  }
  return hit / (SS * SS);
}

/** 方块外柔影：仅 ≥256 大图保留（下方偏移 + 模糊 5% + 黑 25%）；小图会脏，省略 */
function softShadowAlpha(x, y, S, rr) {
  if (S < 256) return 0;
  const dy = Math.max(1, Math.round(S * 0.016));
  const blur = S * 0.05;
  const d = sdRoundRect(x + 0.5, y + 0.5 - dy, S, S, rr);
  const t = clamp(-d / blur, 0, 1);
  return SOFT_SHADOW_RATIO * t * t * (3 - 2 * t);
}

/** src over dst（straight alpha，alpha 取值 0..1） */
function over(dst, src) {
  const sa = src[3], da = dst[3];
  const a = sa + da * (1 - sa);
  if (a <= 0) return [0, 0, 0, 0];
  const f = (sc, dc) => (sc * sa + dc * da * (1 - sa)) / a;
  return [f(src[0], dst[0]), f(src[1], dst[1]), f(src[2], dst[2]), a];
}

/** 渲染单尺寸；rgb=true 时输出不透明（白底，无柔影） */
function render(S, rgb) {
  const m = metrics(S);
  const out = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    const bt = (y + 0.5) / S;
    const bc = [lerp(BOARD_TOP[0], BOARD_BOT[0], bt), lerp(BOARD_TOP[1], BOARD_BOT[1], bt), lerp(BOARD_TOP[2], BOARD_BOT[2], bt)];
    for (let x = 0; x < S; x++) {
      const cov = boardCoverage(x, y, S, m.rr);
      const gc = Math.floor((x - m.ox) / m.cell);
      const gr = Math.floor((y - m.oy) / m.cell);
      let gcol = null;
      if (maskAt(gc, gr)) gcol = L_COLOR;                       // L 主体（最上层）
      else {
        for (let t = 1; t <= m.layers; t++) {                   // 挤出阴影：最内层压在最上面
          if (maskAt(gc - t, gr - t)) { gcol = SHADE[t]; break; }
        }
      }
      let dst = rgb ? [255, 255, 255, 1] : [0, 0, 0, softShadowAlpha(x, y, S, m.rr)];
      dst = over(dst, [bc[0], bc[1], bc[2], cov]);
      if (gcol) dst = over(dst, [gcol[0], gcol[1], gcol[2], cov]);
      const o = (y * S + x) * 4;
      out[o] = Math.round(dst[0]);
      out[o + 1] = Math.round(dst[1]);
      out[o + 2] = Math.round(dst[2]);
      out[o + 3] = Math.round(dst[3] * 255);
    }
  }
  return out;
}

/* ---------- PNG 手写编码器（零依赖） ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
/** rgba: S*S*4（straight alpha）；colorType 6=RGBA / 2=RGB */
function encodePNG(S, colorType, rgba) {
  const bpp = colorType === 6 ? 4 : 3;
  const stride = S * bpp;
  const raw = Buffer.alloc(S * (stride + 1));
  for (let y = 0; y < S; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < S; x++) {
      const s = (y * S + x) * 4, d = y * (stride + 1) + 1 + x * bpp;
      raw[d] = rgba[s]; raw[d + 1] = rgba[s + 1]; raw[d + 2] = rgba[s + 2];
      if (bpp === 4) raw[d + 3] = rgba[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- 生成 ---------- */
const buildDir = __dirname;
const rendererDir = path.join(__dirname, '..', 'renderer');
const log = [];
function write(rel, buf) {
  const p = path.join(buildDir, rel);
  fs.writeFileSync(p, buf);
  log.push([rel, buf.length]);
  return buf;
}

// 各尺寸 PNG（RGBA）
const pngBySize = {};
for (const S of OUTPUT_SIZES) {
  pngBySize[S] = encodePNG(S, 6, render(S, false));
  write(`icon-${S}.png`, pngBySize[S]);
}
// 主 icon.png = 256 RGBA
write('icon.png', pngBySize[256]);

// icon.ico：多尺寸，每项一张 PNG（256 的宽高字节写 0）
const icoEntries = ICO_SIZES.map((S) => ({ S, buf: pngBySize[S] }));
const dirSize = 6 + icoEntries.length * 16;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoEntries.length, 4);
const dirEntries = [];
let offset = dirSize;
for (const e of icoEntries) {
  const d = Buffer.alloc(16);
  d[0] = e.S >= 256 ? 0 : e.S;
  d[1] = e.S >= 256 ? 0 : e.S;
  d[2] = 0; d[3] = 0;
  d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
  d.writeUInt32LE(e.buf.length, 8); d.writeUInt32LE(offset, 12);
  dirEntries.push(d);
  offset += e.buf.length;
}
write('icon.ico', Buffer.concat([header, ...dirEntries, ...icoEntries.map((e) => e.buf)]));

// 应用内品牌图（256 RGB，无透明通道）
fs.writeFileSync(path.join(rendererDir, 'brand.png'), encodePNG(256, 2, render(256, true)));
log.push(['../renderer/brand.png', fs.statSync(path.join(rendererDir, 'brand.png')).size]);

// 托盘图（32 RGB）
const trayPath = path.join(rendererDir, 'assets', 'tray.png');
fs.mkdirSync(path.dirname(trayPath), { recursive: true });
fs.writeFileSync(trayPath, encodePNG(32, 2, render(32, true)));
log.push(['../renderer/assets/tray.png', fs.statSync(trayPath).size]);

console.log('gen-icon v3 (pixel italic L · p1-extrude)');
for (const [f, n] of log) console.log(`  ${f}  ${n} bytes`);
console.log(`  icon.ico entries: ${icoEntries.map((e) => e.S).join('/')}`);
