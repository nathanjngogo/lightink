// 零依赖图标生成 v2 —— 复刻用户提供的设计稿
// 构图：squircle 底板 + 蓝青竖向渐变 + 三条白色胶囊「文本行」+ 右下输入光标竖条
// 输出: build/icon.ico + build/icon.png (256px)
const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');

const S = 256;
const R = 58;            // 底板圆角（≈23%，squircle 风格）

// 设计稿元素（x, y, w, h）—— 左右留白 42px，主行宽约 70% 画布
const BARS = [
  { x: 42, y: 58, w: 148, h: 22 },   // 第一行（最长）
  { x: 42, y: 96, w: 100, h: 22 },   // 第二行
  { x: 42, y: 134, w: 100, h: 22 },  // 第三行
];
const CARET = { x: 156, y: 96, w: 16, h: 84 }; // 光标：顶对齐第二行，底探出第三行

function inRoundedRect(x, y, rx, ry, rw, rh, rr) {
  if (x < rx || x >= rx + rw || y < ry || y >= ry + rh) return false;
  const cx = Math.min(Math.max(x, rx + rr), rx + rw - rr);
  const cy = Math.min(Math.max(y, ry + rr), ry + rh - rr);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= rr * rr;
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function pixel(x, y) {
  // 底板：圆角方 + 蓝青竖向渐变 #1E6FB5 → #35C9B8
  if (!inRoundedRect(x, y, 0, 0, S, S, R)) return [0, 0, 0, 0];
  const t = y / S;
  let r = lerp(0x1e, 0x35, t), g = lerp(0x6f, 0xc9, t), b = lerp(0xb5, 0xb8, t);

  // 文本行：白色 → 极浅蓝 微渐变
  for (const bar of BARS) {
    if (inRoundedRect(x, y, bar.x, bar.y, bar.w, bar.h, bar.h / 2)) {
      const bt = (y - bar.y) / bar.h;
      return [lerp(255, 0xea, bt), lerp(255, 0xf4, bt), lerp(255, 0xfb, bt), 255];
    }
  }
  // 光标竖条：白 → 浅青
  if (inRoundedRect(x, y, CARET.x, CARET.y, CARET.w, CARET.h, CARET.w / 2)) {
    const ct = (y - CARET.y) / CARET.h;
    return [lerp(255, 0x9f, ct), lerp(255, 0xe8, ct), lerp(255, 0xdb, ct), 255];
  }
  return [r, g, b, 255];
}

/* --- PNG 编码 --- */
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
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0;
  for (let x = 0; x < S; x++) {
    const [r, g, b, a] = pixel(x, y);
    const off = y * (S * 4 + 1) + 1 + x * 4;
    raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a;
  }
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

/* --- ICO 封装 --- */
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
const dir = Buffer.alloc(16);
dir[0] = 0; dir[1] = 0;               // 256px 编码为 0
dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6);
dir.writeUInt32LE(png.length, 8); dir.writeUInt32LE(22, 12);
const ico = Buffer.concat([header, dir, png]);

fs.writeFileSync(path.join(__dirname, 'icon.ico'), ico);
fs.writeFileSync(path.join(__dirname, 'icon.png'), png);
console.log('icon v2 written,', ico.length, 'bytes');
