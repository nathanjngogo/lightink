# 任务：LightInk 视觉细节 —— 冷灰底 + 按钮光影/悬浮

## 目标文件

- 只改 `app/renderer/index.html`（**不要动** `lightink-macos/` 副本，由主对话统一同步）

## 需求（用户原话）

> 侧边栏和页脚，使用冷灰色，所有按键带光影以及做悬浮。

拆成三条：

### 1. 侧栏与状态栏（页脚）底色改为冷灰

- 当前这两处用的是暖白玻璃色（`--glass` / `--glass-strong`），偏暖黄。改成**冷灰**（带一点点蓝调，低饱和）。
- 浅色主题建议值（可微调，保持同一色系）：
  - 侧栏 `--glass-strong` → `#f4f6f8`
  - 状态栏/工具栏 `--glass` → `#f7f8fa`
  - 冷灰描边 `--glass-border` → `#e4e7ec`
- 深色主题（`html[data-theme="dark"]` 与 `@media(prefers-color-scheme:dark)` 下 `html[data-theme="auto"]` **两块都要改**）：
  - `--glass-strong` → `#1b1e22`
  - `--glass` → `#1f2327`
  - `--glass-border` → `#2a2f35`
- 工具栏（`#toolbar`）与状态栏（`#statusbar`）、侧栏（`#sidebar`）三处保持一致色系。

### 2. 所有按钮带光影

- 给可点击控件加**克制的投影**（不要厚重）：
  - 静止态：`box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.04)`
  - 深色主题下阴影透明度减半或用纯黑低透明度。
- 覆盖范围（至少）：
  - 工具栏 `.tbtn`（含 `.tbtn.tgl` 两个开关、`.tbtn.search`、`.tbtn.mode-lock`）
  - 侧栏 `.side-ico`、`.side-foot button`、`.shelf-btn`
  - 欢迎页 `.w-btn.primary` / `.w-btn.ghost`、`.w-clear`
  - 侧栏列表项 `.tree-item`（hover 才出光影即可）
  - 对话框 `.dlg-btns button`（含 `.primary` / `.danger-ghost`）
  - 设置抽屉里的开关 `.switch`
  - 命令面板条目 `.p-item`
- 不要给纯文字按钮（如 `#btnCloseDoc` 这类无边框项）加明显投影，避免糊成一团。

### 3. 悬浮（hover）反馈

- 所有上述按钮在 `:hover` 时要有**可见但克制的**变化，三者组合：
  - 底色变化（例如 `background: var(--surface2)` 或当前色加深一档）
  - 阴影加深（例如 `0 2px 6px rgba(16,24,40,.10)`）
  - 或上移 1px（`transform: translateY(-1px)`）
- `:active` 时下沉（`translateY(0)` / 阴影回收到静止态）。
- 过渡：`transition: background .15s, box-shadow .15s, transform .15s, color .15s`。
- 保持既有交互不变：开关的 `aria-checked` 状态色、`#btnKeepMode`/`#btnAutosave` 的胶囊样式、搜索框胶囊形状都**不要改结构**，只加光影与悬浮。
- 尊重无动画偏好：新增的 transform/阴影过渡放在 `@media (prefers-reduced-motion: reduce)` 中关闭 transform 位移。

## 约束

- **不得改动**：DOM 结构与 id、`.tbtn{...}` 基础规则里已有的 `display/height/padding/flex/white-space`（这些是排布关键，上一版曾因多写一个 `}` 导致 `.tbtn` 整条被解析器丢弃、工具栏按钮退化成浏览器默认样式）。
- 改完必须自检：`node --check`（提取 `<script type="module">` 内容）通过；并确认样式表里 `.tbtn` 基础规则仍能被解析（用 CDP 读 `document.styleSheets` 里是否存在 `selectorText === '.tbtn'` 的规则）。
- Electron 无 `prompt`/`confirm`，需要弹窗用现有 `#dlg` 体系。

## 验收标准

1. 侧栏与状态栏底色为冷灰（截图/取色确认，不再是暖白）。
2. 上述按钮组在静止态有可见投影，`:hover` 有底色+阴影（或位移）变化，`:active` 有下沉。
3. 深色主题下同样生效（切到深色主题截图核对）。
4. 工具栏仍然单行不换行、无重叠（窗口宽 1280 时右簇完整可见）。
5. `node --check` 通过；`.tbtn` 基础规则可解析。

## 实施记录

（执行方填写：改了哪些选择器、取值、验证命令与结果）