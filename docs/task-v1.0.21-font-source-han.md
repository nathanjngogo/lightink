# 任务书 v1.0.21 —— 全局统一思源黑体（Source Han Sans CN）

> 派发：Hermes（PM）→ CodeBuddy（代码工程师）
> 项目根：`C:/Users/1/Documents/ChatGPT/软件开发`
> 日期：2026-09-21

## 0. 需求（用户拍板）

软件的字体统一使用**思源黑体（Source Han Sans / Noto Sans CJK）**：
- **捆绑字体**（不依赖系统字体，任何机器渲染一致）——字体文件 PM 已备好（见 §1）
- **完全统一**：界面（标题栏/工具栏/侧栏/欢迎页/对话框/菜单/状态栏）+ 编辑区正文/标题 + 代码块 + 快捷键提示 + 数字标签，全部同一字体族。代码块**不再使用等宽字体**（用户明确选择，勿再保留）。

## 1. PM 已备好的素材（不要改动它们）

```
app/renderer/fonts/SourceHanSansCN-Regular.woff2   (weight 400)
app/renderer/fonts/SourceHanSansCN-Medium.woff2    (weight 500)
app/renderer/fonts/SourceHanSansCN-Bold.woff2      (weight 700)
app/renderer/fonts/SourceHanSansCN-Heavy.woff2     (weight 800/900)
```

- 子集：GB2312 全集 + ASCII + 常用符号（7114 码点），单文件 ~1.4MB，合计 5.52MB。
- family 内部名称为 `Source Han Sans CN`（CSS 里 @font-face 的 family 名请定义为 `SourceHanSansCN`，避免与系统已装的全集版本重名冲突，栈里两个名字都写）。
- 打包：`electron-builder.config.cjs` 的 `files: ['renderer/**/*']` 已自动包含 fonts 目录，**无需改打包配置**。
- 子集外字符（生僻字）自动回退系统字体，属预期行为。

## 2. 现状与改动点（已勘察）

`app/renderer/index.html`（WIN 版，MAC 版结构相同）：

| 位置 | 现状 | 改法 |
|---|---|---|
| 主 `<style>`（约 459 行起）`:root` 内 `--font:-apple-system,"MiSans","HarmonyOS Sans SC","Microsoft YaHei UI","PingFang SC","Segoe UI",sans-serif` | 暖栈混用 | 改为 `"SourceHanSansCN","Source Han Sans CN",` + 原栈保留作回退，最后 `sans-serif` |
| `:root` 内 `--mono:"Cascadia Code","JetBrains Mono",Consolas,monospace` | 等宽栈 | 同样改为思源栈（用户要求完全统一；`monospace` 兜底保留） |
| `app/renderer/vendor/crepe-frame.css` 与 `crepe-frame-dark.css` 定义 `--crepe-font-title: 'Noto Serif',…`、`--crepe-font-default: 'Noto Sans',…`、`--crepe-font-code: 'Space Mono',…` | 编辑区三套字体 | **不要直接改 vendor 文件**（它们是第三方主题原样）。在主 `<style>` 里以更高/等价优先级选择器**覆盖这三个变量**（先查它们的定义选择器是什么——`grep -n "crepe-font-default" vendor/crepe-frame.css` 看所在选择器，用相同选择器写在主 style 之后，或用 `html`/`:root` 中胜出者）。覆盖值统一思源栈；`--crepe-font-code` 也改思源（用户拍板）。 |
| 主 `<style>` 顶部 | 无 @font-face | 新增 4 条 @font-face（见 §3 模板），放主 style 最前面（`<style>` 后第一个规则前） |

**禁改**：`vendor/katex-export.css`、KaTeX 字体（数学公式符号字体，不属于"界面字体"）；导出 HTML 模板里的字体逻辑本轮不动（导出文档字体跟随文档打开者机器，属另一话题）。

## 3. @font-face 模板（路径相对 `renderer/index.html`）

```css
/* ===== 思源黑体（SIL OFL 1.1，Adobe/Google 官方子集 woff2） ===== */
@font-face{font-family:"SourceHanSansCN";font-weight:400;font-style:normal;font-display:swap;
  src:url("fonts/SourceHanSansCN-Regular.woff2") format("woff2")}
@font-face{font-family:"SourceHanSansCN";font-weight:500;font-style:normal;font-display:swap;
  src:url("fonts/SourceHanSansCN-Medium.woff2") format("woff2")}
@font-face{font-family:"SourceHanSansCN";font-weight:700;font-style:normal;font-display:swap;
  src:url("fonts/SourceHanSansCN-Bold.woff2") format("woff2")}
@font-face{font-family:"SourceHanSansCN";font-weight:900;font-style:normal;font-display:swap;
  src:url("fonts/SourceHanSansCN-Heavy.woff2") format("woff2")}
```

UI 现存字重分布：400 / 600×13 / 700×5 / 800×1。600/800 会分别就近取 500/900 档，属预期。

## 4. macOS 副本同步（必做）

改完 WIN 版 `app/renderer/index.html` 后，按上次任务书 §3 同款方法同步 `lightink-macos/app/renderer/index.html`：
- 以 WIN 全文为基座，回贴 mac 适配两块（CSS `html[data-platform="mac"]` 3 条规则 + 启动段 IS_MAC/swapCtrl）；
- 字体文件**复制**一份到 `lightink-macos/app/renderer/fonts/`；
- 断言：两文件差异行只属于平台适配块。

## 5. 验收标准（逐条给证据）

| # | 标准 | 取证方法 |
|---|---|---|
| F1 | `document.fonts.ready` 后，`getComputedStyle(document.querySelector('#titlebar .brand')).fontFamily` 以 `SourceHanSansCN` 开头 | CDP |
| F2 | 工具栏按钮、侧栏项、欢迎页 h1/sub、状态栏、对话框标题的 computed fontFamily 同样命中 | CDP，逐一列出 |
| F3 | 编辑区 `.ProseMirror`（打开任一文档）computed fontFamily 命中，且标题/正文/代码块三者都覆盖（代码块内 `pre/code` 抽查） | CDP |
| F4 | `document.fonts.check('16px SourceHanSansCN')` === true；四条 FontFace 均 status=loaded | CDP |
| F5 | 深浅两个主题下字体一致（切 dark 复测 F1/F3） | CDP |
| F6 | 中文渲染**无回退到宋体**的观感（截图或取 `.brand` 的 `offsetWidth` 变化对比：临时给测试元素指定 font-family=SourceHanSansCN vs "SimSun"，宽度应不同） | CDP 数值 |
| F7 | KaTeX 公式字体不受影响：`getComputedStyle(document.querySelector('.katex')).fontFamily` 包含 KaTeX_ | CDP |
| F8 | 主 style 花括号配平；两版 `node --check` PASS | 脚本 |
| F9 | mac 断言（§4）+ mac 版 @font-face/变量存在性 grep | 脚本 |

## 6. 边界与风险

- **字体加载失败**（文件丢失等极端情况）：font-family 栈里保留了系统字体回退，不会白屏；`font-display:swap` 保证先显回退字后切换，不闪空。
- 子集外生僻字回退系统字体是预期，不要为此把全集 8MB×4 塞进去。
- 不改任何 DOM 结构 / id / 事件逻辑；只动 CSS 与（必要时）`<link>`/`<style>` 内容。
- 如果覆盖 `--crepe-font-*` 时发现 frame css 的选择器特异性更高（比如挂在 `.milkdown` 上），用**同等或更高特异性的选择器**写在主 style 中，不得用 `!important` 以外的 hack；实在必要时允许 `!important` 并登记。

## 7. 完成后

把 §5 各条实测结果、改动行号摘要、mac 断言输出，写入本文件末尾「实施记录」。输出一行 `FONT_DONE + 一句话结论`。

---

## 实施记录

执行者：CodeBuddy（代码工程师）｜执行日期：2026-09-21｜无 CDP 环境，§5 的 CDP 条项（F1–F7）由 PM 代跑，此处只交付静态验证。

### 1. 改动位置摘要

**`app/renderer/index.html`（WIN 版）——共 3 处，+19 行**

| # | 位置 | 改动 |
|---|---|---|
| W1 | 主 `<style>` 第 12–21 行（`<style>` 在第 11 行，本块之后第 22 行为原首规则 `*[hidden]`） | 新增 4 条 `@font-face`，family `SourceHanSansCN`，weight 400/500/700/900，路径 `fonts/SourceHanSansCN-{Regular,Medium,Bold,Heavy}.woff2`，`font-display:swap`。模板与 §3 逐字符一致。 |
| W2 | `:root` 内（原第 29–30 行 → 现第 38–39 行） | `--font` 改为 `"SourceHanSansCN","Source Han Sans CN",` + 原栈全量保留作回退 + `sans-serif`；`--mono` 改为 `"SourceHanSansCN","Source Han Sans CN","Cascadia Code","JetBrains Mono",Consolas,monospace`（思源在前，等宽仅作极端兜底）。**未删除任何原回退项。** |
| W3 | 主 `<style>` 末尾（`</style>` 前，原第 453 行后 → 现第 463–468 行） | 新增 `.milkdown{ --crepe-font-title / --crepe-font-default / --crepe-font-code }` 三条变量覆盖，值统一思源栈（`--crepe-font-code` 亦为思源栈，代码块不再走等宽）。**未使用 `!important`。** |

**选择器特异性说明**：`grep -n "crepe-font-default" app/renderer/vendor/crepe-frame.css` 显示定义处选择器为 `.milkdown`（`crepe-frame.css:21-24`，`crepe-frame-dark.css:21-23` 同为 `.milkdown`）。故主 style 用**完全相同的 `.milkdown`** 选择器；主 style 位于 4 个 `<link>` **之后**，同特异性下后者胜出，无需提权、无需 `!important`。`crepe-common.css` 中所有引用点均为 `var(--crepe-font-title/default/code)`，故一并被覆盖。**vendor 三个 css 文件零改动。**

**`lightink-macos/app/renderer/index.html`（MAC 版）**

- 以改好的 WIN 版**全文为基座**重建，再回贴两块平台适配（文本与 HEAD 版本逐字符相同）：
  - CSS：`/* ===== macOS 平台适配 ===== */` + 3 条 `html[data-platform="mac"]` 规则，插在 `.win-controls{display:flex;height:100%}` **之前**（现第 113–116 行）。
  - JS：`const IS_MAC ... window.__swapCtrl = swapCtrl; }`，插在 `/* ---------- 启动 ---------- */` **之后**、`applySettings(); applyTheme();` **之前**（现第 1789–1803 行）。
- 字体复制：`lightink-macos/app/renderer/fonts/` 新建并复制 4 个 `.woff2`（1,415,816 + 1,429,076 + 1,458,380 + 1,482,460 = 5,785,732 B，与 WIN 侧逐字节一致）。
- 打包确认（未改配置）：`app/electron-builder.config.cjs:8` 与 `lightink-macos/app/electron-builder.config.cjs:9` 的 `files` 均为 `['main.cjs','preload.cjs','renderer/**/*']`，两平台 `fonts/` 目录自动随包，**无需改打包配置**（与 §1 一致）。

**未改动**：DOM 结构 / id / 事件逻辑、`vendor/*`（含 katex 字体与 `katex-export.css`）、打包配置、导出 HTML 模板内的字体逻辑（`index.html:1557,1561`，按 §2 本轮不动）。

### 2. 验证输出（静态）

**① mac 断言（§4）——`diff app/renderer/index.html lightink-macos/app/renderer/index.html`**

基线复核（改动前，`git show HEAD:` 两版对比）与改动后对比，输出形状完全一致，均为**纯新增 2 块、无任何其他差异**：

```
112a113,116
> /* ===== macOS 平台适配 ===== */
> html[data-platform="mac"] .win-controls{display:none}          /* 交通灯替代自绘按钮 */
> html[data-platform="mac"] header#titlebar .brand{margin-left:72px} /* 让位交通灯 */
> html[data-platform="mac"] #titlebar{padding-left:8px}
1784a1789,1803
> // Platform flag: macOS uses native traffic lights, custom win-controls hidden via CSS
> const IS_MAC = navigator.userAgent.includes('Mac');
> document.documentElement.dataset.platform = IS_MAC ? 'mac' : 'win';
> ... （swapCtrl 块 14 行，与 HEAD 版逐字符相同）
```

→ **PASS：两文件差异行只属于这两块平台适配。** 另 `git status --porcelain` 确认被修改的受版本控制文件仅这 2 个 html。

**② 脚本校验（F8）**

```
[app/renderer/index.html]             main <style> braces: { =288  } =288  -> BALANCED PASS
  @font-face count = 4  (400/500/700/900)
  首个内容为「思源黑体」注释块 -> PASS
  --font head = "SourceHanSansCN"  PASS | --mono head = "SourceHanSansCN"  PASS
  override --crepe-font-title  -> SourceHanSansCN  PASS
  override --crepe-font-default-> SourceHanSansCN  PASS
  override --crepe-font-code   -> SourceHanSansCN  PASS
  node --check (提取 <script type="module">，992 行) -> PASS

[lightink-macos/app/renderer/index.html] main <style> braces: { =291  } =291  -> BALANCED PASS
  @font-face count = 4  (400/500/700/900)
  首个内容为「思源黑体」注释块 -> PASS
  --font head = "SourceHanSansCN"  PASS | --mono head = "SourceHanSansCN"  PASS
  override --crepe-font-title / --crepe-font-default / --crepe-font-code  -> SourceHanSansCN  PASS×3
  node --check (提取 <script type="module">，1007 行) -> PASS

ALL STATIC CHECKS PASS
```

（WIN 288 对 vs MAC 291 对，差额 3 恰为 mac 加入的 3 条 `html[data-platform="mac"]` 规则。）

**③ 存在性 grep（F9 部分）**：两版均含 `@font-face{font-family:"SourceHanSansCN"` ×4 与 `.milkdown{ --crepe-font-*` 覆盖块 ×3 —— 见上表 W1/W3、MAC 同源，PASS。

### 3. 待 PM 代跑（§5 CDP 条项，本环境无 CDP）

F1–F7 全部留待 PM 复核。提示两点，便于 PM 判定：
- **F6 观感**：`--font` 首位即 `"SourceHanSansCN"`，400/500/700/900 四档齐备；UI 现存 600×13 会就近取 500 档、800×1 取 900 档（§3 已述为预期），故个别位置可能略轻/略重，非回退。
- **F7 KaTeX**：未触碰 `vendor/katex*`，`.katex` 自身 `font-family` 规则优先于 `var(--font)` 继承（内联样式级），预期仍含 `KaTeX_`；若 PM 实测异常，请回报，本轮未做任何 katex 侧改动。

**回滚点**：`git checkout -- app/renderer/index.html lightink-macos/app/renderer/index.html`（字体目录为新增，可整体删除）。

