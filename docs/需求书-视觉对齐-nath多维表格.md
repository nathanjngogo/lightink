# 需求书 · 视觉对齐 nath多维表格

- 项目：LightInk（轻墨）Windows 桌面版 · Electron + 单文件渲染器
- 对齐目标：`nathanjngogo/bitable-replica`（产品名 **nath多维表格**）的设计体系 —— Astryx 令牌层
- 真源文件：`app/client/src/tokens.css`（该项目的令牌层 + 深色第二组值）
- 版本：v1.0（2026-11-19）
- 落地文件：`app/renderer/index.html`（样式与导出模板）、`vendor/` 不改

## 1. 目标与边界

**目标**：让 LightInk 的界面语言（色板、圆角、阴影、控件状态、分隔线、滚动条、排版节奏）与 nath多维表格保持一致，肉眼可辨认为「同一套设计体系」。

**只改外观，不改功能**：
- 不改任何交互逻辑、DOM 结构、快捷键、文件读写、设置项语义；
- 不改文案；
- 不改 `app/main.cjs`、`app/preload.cjs`（主进程与 IPC 零改动）；
- 不改 `vendor/`（Crepe、KaTeX、hljs 的第三方文件原样保留；其主题变量在主样式里覆盖，不改源文件）；
- 不改品牌资产 `brand.png`、应用图标（老板既有资产，另案处理）。

## 2. 令牌映射（浅色）

| LightInk 变量 | 改前 | 改后（来源 nath多维表格） |
|---|---|---|
| `--bg` 画布底 | `#fcfdfe` | `#f1f4f7` = Astryx `bg-body` |
| 面板/卡片底 | 无此概念（玻璃半透明） | `#ffffff` = Astryx `bg-surface` |
| `--surface` 浅填充 | `#f2f4f7` | `#f1f4f7` |
| `--surface2` 深填充 | `#e9edf1` | `#e9eef4` = 表头底色 |
| `--ink` 正文 | `#22262a` | `#0a1317` = `text-primary` |
| `--muted` 次级 | `#71767c` | `#4e606f` = `text-secondary` |
| 占位符 | 无 | `#a4b0bc` = `text-disabled` |
| `--border` | `#e2e6ea` | `rgba(5,54,89,.16)` = `border` |
| `--border-strong` | `#cfd5dc` | `#ccd3db` = `border-emphasized` |
| 细分割线 | `rgba(16,24,40,.10)` | `rgba(5,54,89,.10)` = `border-light` |
| `--accent` 主色 | `#177e6d`（墨绿） | `#0064e0`（Astryx accent） |
| 主色 hover / active | 无 | `#0056c4` / `#004aa8` |
| `--accent-soft` | `rgba(23,126,109,.10)` | `#e0edff` |
| `--sel` 选中 | `rgba(23,126,109,.16)` | `rgba(0,100,224,.18)` |
| `--code-bg` | `#f4f4ef`（偏黄） | `#f1f4f7` |
| `--edit-bg` 编辑底 | `#f3f4f1`（偏黄） | `#f1f4f7` |
| `--r-sm` / `--r-md` / `--r-lg` | 6 / 10 / 14 | 4 / 8 / 12（`radius-inner/element/container`） |
| `--shadow-1` / `--shadow-2` | 冷灰双层 | `shadow-low` / `shadow-high`（同 nath） |
| 危险色 | `#c42b1c` | `#e3193b` = `danger`；成功 `#0d8626`；警告 `#e9af08` |
| 玻璃质感 | 半透明 + blur | 取消：面板一律实底（`#ffffff`），nath 无玻璃层 |

## 3. 令牌映射（深色）

按 nath 的深色第二组值，覆盖同一套 `--astryx-*` 名字，兼容层自动跟随：

| 令牌 | 深色值 |
|---|---|
| accent / hover | `#0171e3` / `#2694fe` |
| bg-body / bg-surface / 表头 | `#111112` / `#1f1f22` / `#26262a` |
| text primary / secondary / disabled | `#dfe2e5` / `#aaafb5` / `#6f747c` |
| border / emphasized | `rgba(242,244,246,.10)` / `#494d53` |
| 阴影 | 同结构，透明度 .38–.55 |
| accent-soft / sel | `rgba(1,113,227,.22)` / `rgba(38,148,254,.28)` |

`html[data-theme="dark"]` 与 `@media (prefers-color-scheme: dark) html[data-theme="auto"]` 两处必须同时改，否则「跟随系统」会半浅半深。

## 4. 组件级改造清单

1. **面板**：标题栏 / 工具栏 / 侧栏 / 状态栏 / 抽屉 / 命令面板 / 查找条 / 导出菜单 / 对话框 —— 全部实底白（深色 `#1f1f22`），1px `border-light` 分隔线，去掉半透明+blur。
2. **阅读面**：画布 `#f1f4f7`，正文纸面 `#ffffff` + 1px 边线 + `shadow-low` + 12px 圆角（A4 纸面模式同步：纯白、圆角 4、`shadow-low`）。
3. **控件**：主按钮 `#0064e0 → #0056c4 → #004aa8`；次要按钮圆角 8、边框 `#ccd3db`、文字 `#3c4a56`、1px 微投影；禁用 `opacity .45`；**取消 hover 位移**（nath 无上浮），hover 只改底色 `rgba(5,54,89,.047)`、active `.098`。
4. **输入态**：focus = 主色边框 + `0 0 0 3px rgba(0,100,224,.18)` 光晕；placeholder `#a4b0bc`。
5. **侧栏选中**：主色文字 + 左侧 3px 竖条 + `#e0edff` 底（nath 侧栏口径）。
6. **表格**：表头 `#e9eef4` 底 / `#0a1317` 字 / 500 字重；单元格 1px `rgba(5,54,89,.16)`；行 hover `#f7f9fb`。
7. **滚动条**：10px、拇指 `rgba(5,54,89,.28)`、全圆角（深色 `rgba(255,255,255,.24)`）。
8. **胶囊/标签**：高 20、圆角 10、字号 12（nath pill 口径）。
9. **Crepe 编辑器令牌**：`--crepe-color-primary/inline-code/inline-area/surface/outline/hover/selected` 覆盖为 Astryx 值（行内代码由红色改为正文墨色 + 灰底，勾选框与链接走主色）。
10. **数字**：状态栏、查找计数、设置数值统一 `tabular-nums`。
11. **导出模板（HTML/PDF）**：正文墨色、主色链接、表头 `#e9eef4`、边框 `#d7dfe4`、代码底 `#f1f4f7`，与界面同色板。

## 5. 验收标准（量值，不看感觉）

1. `getComputedStyle(document.documentElement)` 读出兼容层实际值 = 第 2 节表值（浅色）/ 第 3 节表值（深色），逐条打印。
2. 全页面扫描：不存在墨绿 `#177e6d` / `#4cc2ae` / 偏黄色底 `#f4f4ef` / `#f3f4f1` 残留（含导出模板字符串）。
3. 关键界面截图（浅色欢迎页、浅色阅读页、设置抽屉、命令面板、深色阅读页、深色欢迎页）逐张过 vision，专查：半浅半深、白块刺眼、文字叠字、边框消失。
4. 深色 ↔ 浅色双向切换后取值正确（只验单程会漏「深色规则污染浅色」）。
5. 功能不回退：打开文档、阅读/编辑/源码三态切换、设置抽屉、命令面板、查找条、导出菜单可开合；console 无报错。
## 6. 交付记录（2026-11-19）

### 已落地
- `app/renderer/index.html`：令牌层替换为 Astryx 两套值（浅/深 + auto 深色），兼容层零 JSX 改动；组件规则按第 4 节逐条改；Crepe 主题变量覆盖；滚动条；导出模板色板。
- `lightink-macos/app/renderer/index.html`：同一套改动同步（两端口径一致，差异只剩 macOS 交通灯适配块）。
- 未改：`main.cjs`、`preload.cjs`、`vendor/`、品牌图片、任何交互逻辑与文案。

### 评审修出的三处（已修）
1. **书架文件夹行两行折行**：`svg.ic` 是 `display:block`，图标在标签 span 内独占一行 → 加 `.folder-label{display:flex;align-items:center;gap:6px}`，实测图标与文字中心线差 1px、行高 36px。
2. **文件夹表情符号**（📁 / 📂）是唯一暖色，破坏冷色体系 → 换为 Lucide 口径的线性文件夹图标，颜色 `--astryx-text-secondary`。
3. **版本胶囊与画布同色**看不见 → `.w-tag` 改实底白 + `border-light`；分区横线提到 `#c6d0da`。

### 实测数据（1280×860，DPR 2）
- 浅色：`--accent #0064e0`、`--bg #f1f4f7`、`--ink #0a1317`、`--muted #4e606f`、半径 4/8/12；正文纸面 `#ffffff` + 1px 边 + 阴影，宽 836px；表头 `rgb(233,238,244)` / 字重 500 / 字色 `rgb(10,19,23)`；单元格边框 `rgba(5,54,89,.16)`。
- 深色：body `rgb(17,17,18)`、纸面 `rgb(31,31,34)`、工具栏同纸面、无任何白底面板；正文对比度 12.64:1，状态栏 7.44:1。
- 截图逐张过 vision：无叠字、无越界裁切、无半浅半深；像素扫描墨绿残留 0。

### 已知非本次引入
- 窗口宽度 ≤780px 时工具栏 `overflow:hidden` 会裁掉右侧控件（改前 scrollWidth 702 / clientWidth 511，改后同值）—— 与本次改动无关，另案处理。
