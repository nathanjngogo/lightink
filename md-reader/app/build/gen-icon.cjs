// 零依赖图标生成：256px PNG → ICO（内嵌 PNG 条目）
// 用法: node gen-icon.cjs  → 输出 build/icon.ico
const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');

const S = 256;          // 画布
const R = 56;           // 圆角半径
const CELL = 8;         // 像素矩阵单元大小
// "M" 像素矩阵（14×12）
const M = [
  'X...........X',
  'XX.........XX',
  'X.X.......X.X',
  'X..X.....X..X',
  'X...X...X...X',
  'X....X.X....X',
  'X.....X.....X',
  'X...........X',
  'X...........X',
  'X...........X',
  'X...........X',
  'X...........X',
];

function inRoundedRect(x, y) {
  const cx = [R, S - R], cy = [R, S - R];
  for (const cxs of cx) for (const cys of cy) {
    const corner = (x < R && y < R && cxs === R && cys === R) ||
      (x > S - R && y < R && cxs === S - R && cys === R) ||
      (x < R && y > S - R && cxs === R && cys === S - R) ||
      (x > S - R && y > S - R && cxs === S - R && cys === S - R);
    if (corner) {
      const dx = x - cxs, dy = y - cys;
      if (dx * dx + dy * dy > R * R) return false;
    }
  }
  return true;
}

const mw = M[0].length * CELL, mh = M.length * CELL;
const ox = Math.floor((S - mw) / 2), oy = Math.floor((S - mh) / 2) - 4;

function pixel(x, y) {
  if (!inRoundedRect(x, y)) return [0, 0, 0, 0];
  // 对角渐变 #1d9482 → #136457
  const t = (x + y) / (2 * S);
  let r = Math.round(29 + (19 - 29) * t);
  let g = Math.round(148 + (100 - 148) * t);
  let b = Math.round(130 + (87 - 130) * t);
  // 白色 M 字
  const mx = Math.floor((x - ox) / CELL), my = Math.floor((y - oy) / CELL);
  if (mx >= 0 && mx < M[0].length && my >= 0 && my < M.length && M[my][mx] === 'X') {
    return [255, 255, 255, 255];
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
ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0; // filter none
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

/* --- ICO 封装（单条目 PNG） --- */
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
const dir = Buffer.alloc(16);
dir[0] = S >= 256 ? 0 : S;   // 宽（256 编码为 0）
dir[1] = S >= 256 ? 0 : S;   // 高（256 编码为 0）
dir[2] = 0; dir[3] = 0;               // 色板数、保留
dir.writeUInt16LE(1, 4);              // 色彩平面
dir.writeUInt16LE(32, 6);             // bpp
dir.writeUInt32LE(png.length, 8);     // 数据大小
dir.writeUInt32LE(22, 12);            // 数据偏移
const ico = Buffer.concat([header, dir, png]);

const out = path.join(__dirname, 'icon.ico');
fs.writeFileSync(out, ico);
fs.writeFileSync(path.join(__dirname, 'icon.png'), png);
console.log('icon.ico + icon.png written,', ico.length, 'bytes');
