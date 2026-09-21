# 任务书 v1.0.22 —— 应用图标全量替换（像素风斜体 L · p1-extrude 定稿）

> 派发：Hermes（PM）→ CodeBuddy（代码工程师）
> 项目根：`C:/Users/1/Documents/ChatGPT/软件开发`
> 定稿参考图：`docs/icon-target-p1.png`（1024px，已备好）
> 日期：2026-09-21

## 0. 设计定稿（用户已选定，不要再改设计）

**像素风斜体 L**：白色圆角方块底 + 黑色斜体像素 L + 右下 3 层灰色挤出阴影（extrude）。

### 字形网格（16×16，高位=左，1=黑格）

```js
const MASK = [0x0000,0x0000,0x0000,0x0700,0x0700,0x0700,0x0700,
              0x0E00,0x0E00,0x0E00,0x0E00,0x1C00,0x1FE0,0x1FE0,
              0x0000,0x0000];
// 行 r、列 c 判定：(MASK[r] >> (15-c)) & 1
// 有效行 3..13（11 行），斜体阶梯：顶部右移，底脚 8 格向右伸出
```

### 颜色（逐字使用）

| 元素 | 值 |
|---|---|
| 底板渐变 | 上 `#FFFFFF` → 下 `#F7F8FA`（垂直线性，两端色） |
| 底板圆角 | 半径 = S × 0.225（squircle 感用普通圆角即可） |
| L 主体 | `#1C1E21`（近黑，RGB 28,30,33） |
| 挤出阴影 3 层 | 偏移 (t,t) 格，t=1..3；色从外到内 `#E2E4E8`→`#D5D8DD`→`#C8CCD2`（灰阶渐深，蓝味） |
| 方块外柔影 | 仅 256/1024 大图保留（下方 3-4px、模糊 5%、黑 25%）；≤128 尺寸**省略**（小图会脏） |

### 布局

- 字形+阴影整体高占底板 **≈72%**，水平垂直居中后**上移 1%**；
- 换算：黑体 11 行，含阴影 14 格 → `cell = round(S * 0.72 / 14)`，最小 1；
- 底板外区域透明（PNG alpha=0）。

## 1. 实现方式：改写 `app/build/gen-icon.cjs`（v3）

保持**零依赖**（node:fs/zlib/path，PNG 手写编码器、CRC32、chunk 封装——现脚本里都已有，沿用），把 `pixel(x,y)` 换成按 §0 规格实现。要求：

1. `render(S)` 参数化：同一设计按任意 S 直接重采样绘制（比例参数随 S 缩放），**不要用 256 缩到 16**（会糊）。
   - `S >= 48`：完整 3 层 extrude；
   - `S <= 32`：合并为 1 层阴影（t=1，色 `#C8CCD2`），且 L 主体列数不变但 cell 至少 1px——16px 时若 3 层放不下就 1 层；
   - 圆角、渐变、居中逻辑全部按 S 比例计算。
2. 输出（覆盖现有文件，路径不变）：
   - `app/build/icon.png`：256 RGBA
   - `app/build/icon.ico`：**多尺寸** 16/24/32/48/64/128/256，每个尺寸一张 PNG 条目（ICO 目录 7 项；256 的 width/height 字节写 0，现有代码有先例）
   - `app/build/icon-16.png … icon-256.png`：各尺寸单文件（同 render(S) 产物，RGBA）
   - `app/renderer/brand.png`：256，**RGB 无透明**（把底板画到不透明白底上——应用内 `<img>` 用，参考现文件形态）
   - `app/renderer/assets/tray.png`：32 RGB（托盘用，现在就是 RGB）
3. 脚本末尾 `console.log` 输出每个文件的字节数，便于核验。
4. 运行 `node app/build/gen-icon.cjs` 生成以上全部。

## 2. macOS 副本同步

- 把 v3 脚本原样复制/同步到 `lightink-macos/app/build/gen-icon.cjs`（两版脚本历史上逐字节相同，继续保持相同）；
- 运行 `node lightink-macos/app/build/gen-icon.cjs` 生成 mac 侧同名 7 类文件（`lightink-macos/app/build/*` + `lightink-macos/app/renderer/brand.png` + `lightink-macos/app/renderer/assets/tray.png`）；
- mac 的 electron-builder 用 `build/icon.png`（256）自动转 icns，无需额外文件。

## 3. 不改的东西

- `Modern_app_icon_design_for_a_M_2026-09-01T08-20-12.png`（旧设计稿，历史档案）；
- `README.md`（引用 `app/build/icon.png` 路径不变，内容换图后自动生效）；
- `electron-builder.config.cjs`（两版，路径不变）；
- 渲染层 HTML/CSS（brand.png 路径与样式不变）；
- `tools/` 下任何历史截图。

## 4. 验收标准

| # | 标准 | 取证 |
|---|---|---|
| G1 | `node app/build/gen-icon.cjs` 与 mac 版各运行成功，无报错 | stdout 文件清单+字节数 |
| G2 | icon.ico 目录含 7 条目、各尺寸齐全（16..256），文件可被解析（自写 20 行验证脚本读 ICONDIRENTRY） | 脚本输出 |
| G3 | 256 PNG 视觉对齐 §0：白底圆角、黑斜 L、3 层挤出、整体占比 ~72% | 用 python+PIL 量黑像素 bbox 占比与色值抽样 |
| G4 | 16/32 PNG：L 可辨、阴影合并为 1 层、无越界 | 同上 |
| G5 | brand.png/tray.png 为 RGB 无 alpha 通道，尺寸 256/32 | PIL mode 检查 |
| G6 | Win 与 mac 两侧 7 类文件逐字节一致（同一脚本同一输入） | certutil -hashfile 或 python hashlib 比对 |
| G7 | git diff --stat 只含预期文件（build 资产 ×2、brand/tray ×2、gen-icon ×2） | git status |

## 5. 完成后

把 G1–G7 结果与关键数值（bbox 占比、ico 条目表、哈希比对）写入本文件「实施记录」。输出 `ICON_DONE + 一句话结论`。

---

## 实施记录

> 实施人：CodeBuddy　日期：2026-09-21　脚本：`app/build/gen-icon.cjs` v3（零依赖，node:fs/zlib/path）
> mac 副本 `lightink-macos/app/build/gen-icon.cjs` 与本版 **sha256 完全相同**

### G1 脚本运行成功（stdout 文件清单 + 字节数）

Win（`node app/build/gen-icon.cjs`）与 mac（`node lightink-macos/app/build/gen-icon.cjs`）输出完全一致：

```
gen-icon v3 (pixel italic L · p1-extrude)
  icon-16.png  234 bytes      icon-24.png  279 bytes      icon-32.png  350 bytes
  icon-48.png  490 bytes      icon-64.png  613 bytes      icon-128.png 1028 bytes
  icon-256.png 2643 bytes     icon.png     2643 bytes     icon.ico     5755 bytes
  ../renderer/brand.png  1691 bytes
  ../renderer/assets/tray.png  280 bytes
  icon.ico entries: 16/24/32/48/64/128/256
```

两版脚本 sha256：`b8cb8794a2fae87d56a4a155817a72b879698c0c67fb091b54237ad89ba719c2`（== 一致）

### G2 icon.ico 多尺寸结构（自写 ICONDIRENTRY 解析脚本校验）

ICONDIR `reserved=0 type=1 count=7`，header+目录 = 118 B，首条图像偏移 = 118 ✓

| # | width | height | planes | bpp | bytesInRes | imageOffset | PNG | IHDR 实测 |
|---|---|---|---|---|---|---|---|---|
| 0 | 16 | 16 | 1 | 32 | 234 | 118 | 是 | 16×16 |
| 1 | 24 | 24 | 1 | 32 | 279 | 352 | 是 | 24×24 |
| 2 | 32 | 32 | 1 | 32 | 350 | 631 | 是 | 32×32 |
| 3 | 48 | 48 | 1 | 32 | 490 | 981 | 是 | 48×48 |
| 4 | 64 | 64 | 1 | 32 | 613 | 1471 | 是 | 64×64 |
| 5 | 128 | 128 | 1 | 32 | 1028 | 2084 | 是 | 128×128 |
| 6 | 256 | 256 | 1 | 32 | 2643 | 3112 | 是 | 256×256（宽高字节写 0）|

### G3 256 PNG 视觉对齐 §0（PIL 实测）

- **L+挤出整体 bbox** = (57,34)–(199,215)，即 **143 × 182 px** → 宽 55.9%、**高 71.1% ≈ 72%** ✓（§0 要求整体高占底板 ≈72%）
- 纯黑 L 主体 bbox = (57,34)–(160,176) = 104 × 143 px（8 格 × 11 格，cell=13）
- 几何换算：`cell = round(256×0.72/14) = 13`；`contentW=(8+3)×13=143`；`contentH=(11+3)×13=182`；`ox=57, oy=34`（居中后上移 1% = 2.56px 已计入）
- 色值抽样（x=90/128/141/154, y=79，即 mask 第 6 行）：

| 元素 | 实测 | §0 规定 | 结论 |
|---|---|---|---|
| L 主体 | (28,30,33) | `#1C1E21` | ✓ |
| 挤出 t=1（最内） | (226,228,232) | `#E2E4E8` | ✓ |
| 挤出 t=2 | (213,216,221) | `#D5D8DD` | ✓ |
| 挤出 t=3（最外） | (200,204,210) | `#C8CCD2` | ✓ |
| 底板顶 | (255,255,255) | `#FFFFFF` | ✓ |
| 底板底 | (247,248,250) | `#F7F8FA` | ✓ |
| 底板外 | (0,0,0,0) | 透明 | ✓ |

- 圆角半径 = S × 0.225（256 → 57.6px），与参考图实测趋势一致。

### G4 小尺寸（16/32）：1 层阴影、无越界

| 文件 | 黑像素 bbox | 越界 | 阴影层数 |
|---|---|---|---|
| icon-16.png | (4,2)–(11,12) | 否（0≤x,y≤15）| 1 层，唯一灰阶 (226,228,232)=`#E2E4E8` |
| icon-32.png | (7,4)–(22,25) | 否（0≤x,y≤31）| 1 层，唯一灰阶 (226,228,232)=`#E2E4E8` |

`S ≤ 32` 分支：`layers=1`、`cell = max(1, …)`，16px 时 cell=1，L 字形 8 列完整保留、可辨。

### G5 brand.png / tray.png 无 alpha

| 文件 | PIL mode | 尺寸 |
|---|---|---|
| `app/renderer/brand.png` | **RGB**（无 alpha）| 256×256 |
| `app/renderer/assets/tray.png` | **RGB**（无 alpha）| 32×32 |
| `app/build/icon.png` | RGBA（应有 alpha）| 256×256 |

### G6 Win / mac 逐字节一致（sha256）

| 文件 | 字节 | sha256 | Win==mac |
|---|---|---|---|
| build/icon.png | 2643 | `76b8211002cedb54d60169e8e5c4a8f42fd514ead67cf748c7fa32a9e9e5a69a` | == |
| build/icon-256.png | 2643 | 同上（与 icon.png 同一 render(256) 产物）| == |
| build/icon.ico | 5755 | `414f8240ed7570ad1cc6f64eb1fb5c2cb90dc9159930178225ea8e1890e40818` | == |
| build/icon-16.png | 234 | `ee387f206326c639b4be05b1b8159faeaa6bdcf71f8109510b8f13fcffae5ae5` | == |
| build/icon-24.png | 279 | `133fc61b38ef0e33fc033ab453a45201e00989e1bce5cd88f9228fd166c5116c` | == |
| build/icon-32.png | 350 | `06a411c827341fb4fb08ee039b35653d332f9b29339ebc2f8e27a0ea4338b86d` | == |
| build/icon-48.png | 490 | `085b6685251cd1ab4c87f3a3ca5e245b7cd165d2072aa7ca7c3ca68cdb212e45` | == |
| build/icon-64.png | 613 | `faa446447ce1ca2cb3823cf543f15b03fe2f4190dad42251b21e201e53cea7ad` | == |
| build/icon-128.png | 1028 | `a1a8451191833e5e683cfe0bb0bc97d129e170ae119961119364f249ee7e8cd1` | == |
| renderer/brand.png | 1691 | `ef31fc8a84945f56556181ba814cb525d4b0e0abec655b7970e25442301656a4` | == |
| renderer/assets/tray.png | 280 | `acc7bcedb5080c84dfb264689f4099cf3419a02b67b3c4e735ae563fbbe9bb5c` | == |

**11/11 逐字节一致**；脚本本体 2/2 逐字节一致。

### G7 git status 变更范围

改动文件仅：`app/build/gen-icon.cjs`、`app/build/icon.png`、`app/build/icon.ico`、`app/build/icon-{16,24,32,48,64,128,256}.png`、`app/renderer/brand.png`、`app/renderer/assets/tray.png`（11 个）+ `lightink-macos/app/` 下同名 11 个 = **22 个**，全部属于「build 资产 + brand/tray + gen-icon」预期集合。
未触碰：`README.md`、`electron-builder.config.cjs`（两版）、渲染层 HTML/CSS、`tools/`、旧设计稿 `Modern_app_icon_design_for_a_M_*.png`、`docs/使用说明书.md`（该文件在我接手前已是 modified 状态，非本次改动）。

### §0 与定稿参考图的 1 处判读说明（已按参考图实现，请 PM 复核）

`docs/icon-target-p1.png`（1024）逐像素扫描得到的挤出三层实测色为 **t=1 最内 (212,212,216) → t=2 (198,198,202) → t=3 最外 (184,184,188)**，即「**内浅外深**」。
而 §0 表格写作「色**从外到内** `#E2E4E8`→`#D5D8DD`→`#C8CCD2`（灰阶渐深）」——若按字面把 `#E2E4E8` 当最外层，则方向与参考图**相反**。

处理方式：**hex 值逐字采用 §0**，**内外方向按参考图实测**（t=1→`#E2E4E8`，t=2→`#D5D8DD`，t=3→`#C8CCD2`），保证成图与定稿参考图同向（贴 L 主体最浅、向外渐深）。另：参考图三层比 §0 hex **整体略深约 12–16/255**（212/198/184 vs 226/213/200），本次以 §0 hex 为准。若 PM 要求 100% 复刻参考图像素值，只需替换 `SHADE` 常量为 `{[1]:[212,212,216],[2]:[198,198,202],[3]:[184,184,188]}` 并重跑脚本（两版），1 分钟可切。

### 实现补充说明

- `render(S)` 参数化：按 S 直接算 `cell/ox/oy/圆角`，**不做位图缩放**（无 256→16 的糊化）。
- 挤出压层顺序：先 t=layers … 后 t=1（最内层压在最上），L 主体最后压顶；`maskAt()` 越界安全。
- 圆角用 4×4 超采样求覆盖率做抗锯齿；L/挤出为整格硬边（保持像素风锐利）。
- 方块外柔影：**仅 S ≥ 256 的 RGBA 产物**绘制（下方偏移 `round(S*0.016)`、模糊半径 `S*0.05`、峰值黑 25%），≤128 及 RGB 产物（brand/tray）省略——小图会脏，且 RGB 为白底不需要。参考图 1024 同名位置实测 alpha 峰值约 13/255，量级一致。
- 注意：因柔影存在，用「RGB 阈值取黑像素 bbox」会把柔影算进去（参考图同样如此，其 bbox 也是全画布）。核验占比请按 **alpha>128 且 r<215** 取 L+挤出，得 143×182 / 71.1%。