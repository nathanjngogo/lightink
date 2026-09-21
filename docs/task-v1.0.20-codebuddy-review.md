# 任务书 v1.0.20-visual-polish —— 冷灰底 + 按钮光影/悬浮（CodeBuddy 工程审核 + 修复）

> 派发对象：CodeBuddy（代码工程师）
> 派发方：Hermes（PM）
> 日期：2026-09-20
> 关联：docs/task-v1.0.20-visual-polish.md（需求原文）、RELEASE-NOTES-v1.0.19.md

---

## 0. 你的角色与本次任务性质

PM 已将本需求的代码改动直接落地在 `app/renderer/index.html`（工作区未提交状态）。
你的职责**不是重写**，而是：

1. **工程审核**（code review）：对照本任务书 §2 的验收标准，逐条核查已落地的 CSS/变量改动；
2. **发现问题就地修复**：只允许改 `app/renderer/index.html`（主渲染层），修完在 §5 登记；
3. **同步 macOS 副本**：把主渲染层的全部改动同步到 `lightink-macos/app/renderer/index.html`（同步方法见 §3）；
4. **跑回归**：按 §4 命令执行，全部通过并在 §5 记录输出摘要。

## 1. 已落地改动摘要（审核基线）

### 1.1 冷灰配色（主题变量）

浅色（`:root`）：
- `--bg:#fcfdfe`；`--surface:#f2f4f7`；`--surface2:#e9edf1`
- `--border:#e2e6ea`；`--border-strong:#cfd5dc`
- `--glass:rgba(247,249,251,.86)`；`--glass-strong:rgba(243,246,249,.93)`（工具栏+状态栏 / 侧栏）
- `--glass-border:rgba(16,24,40,.10)`
- 新变量：`--btn-sh`（静止投影）、`--btn-sh-hi`（悬浮加深投影）、`--accent-sh`（主按钮品牌色投影）

深色（`html[data-theme="dark"]` 与 `@media(prefers-color-scheme:dark)` 下 `html[data-theme="auto"]` **两块都要改、值必须一致**）：
- `--surface:#23272c`；`--surface2:#2b3036`；`--border:#2c3137`；`--border-strong:#3a4048`
- `--glass:rgba(24,27,31,.72)`；`--glass-strong:rgba(28,32,37,.86)`
- `--btn-sh/--btn-sh-hi/--accent-sh` 为纯黑低透明度版本

### 1.2 按钮光影与悬浮（文件主样式块末尾一段新 CSS）

- 过渡统一：`.tbtn,.side-ico,.shelf-btn,.side-foot button,.w-btn,.w-clear,.dlg-btns button,.p-item,.tree-item` → `background/box-shadow/transform/color/border-color .15s ease`
- 静止态投影（`--btn-sh`）：`.tbtn.search,.side-foot button,.w-btn,.w-clear,.dlg-btns button,.shelf-btn,#btnAutosave,#btnKeepMode`
- 主按钮品牌投影：`.w-btn.primary` → `--accent-sh`；hover 叠加 `--btn-sh-hi` + `translateY(-1px)`
- hover 通用：`box-shadow:var(--btn-sh-hi); transform:translateY(-1px)`；`:active` 回收到静止态
- 纯图标/文字按钮（`.tbtn:not(.search):not(.tgl)`、`.side-ico`）hover 才出轻投影，`:active` 下沉 `translateY(1px)`
- 开关胶囊 `.tbtn.tgl .pill`：`inset 0 0 0 1px rgba(16,24,40,.06)` + 外投影
- 列表项/命令面板：`.tree-item:hover`/`.p-item:hover` 出轻投影
- `@media (prefers-reduced-motion: reduce)`：关闭全部 transform 位移

## 2. 验收标准（逐条核，不满足就修）

| # | 标准 | 验证方法 |
|---|---|---|
| V1 | 侧栏、工具栏、状态栏为冷灰（蓝灰）调，不再是暖白/米黄 | 起实例截图 + `getComputedStyle` 读 `--glass-strong` 应为 `rgba(243,246,249,.93)` |
| V2 | 主按钮（打开文件）静止态有品牌色投影；hover 上浮 1px + 阴影加深；active 回沉 | computed style + 截图 |
| V3 | 搜索命令框、侧栏底部新建文档、对话框按钮、shelf-btn：静止轻投影 + hover 上浮 | 同上 |
| V4 | 纯图标按钮（侧栏开关/主题/设置）常态干净、hover 有轻投影、active 下沉 | 同上 |
| V5 | 开关胶囊（阅读优先/自动保存）有立体感（inset 描边+外投影），**结构与 aria-checked 行为不得改变** | CDP 切换开关验证联动仍正常 |
| V6 | 深色主题两块变量一致且生效 | diff 两块声明文本；切深色截图 |
| V7 | `prefers-reduced-motion` 下 transform 全关 | 读 CSS 规则确认 |
| V8 | 工具栏右簇在 1280 窗口宽下仍单行、无重叠（上一版曾因 `#toolbar` 多写 `}` 吞掉 `.tbtn` 规则） | CDP：`.tbtn` 基础规则存在、toolbar `scrollWidth==clientWidth`、相邻按钮 rect 不相交 |
| V9 | 主样式块花括号配平；`node --check` 通过 | §4 命令 |

**禁止事项**：不改 DOM 结构/id；不改 `.tbtn` 基础排布属性（display/height/padding/flex/white-space）；不引入新依赖。

## 3. macOS 副本同步（必做）

`lightink-macos/app/renderer/index.html` 落后主渲染层，且含平台适配块。同步方法：

1. 读取 WIN 版 `app/renderer/index.html` 全文作为基座；
2. 回贴两块平台适配（这两块是 mac 版独有，**不得丢**）：
   - CSS：`/* ===== macOS 平台适配 ===== */` 开头的 3 条 `html[data-platform="mac"]` 规则，插在 `.win-controls{display:flex;height:100%}` 之前；
   - JS：`/* ---------- 启动 ---------- */` 之后、`applySettings(); applyTheme();` 之前的 `IS_MAC`/`swapCtrl` 块（⌘ 替换 Ctrl）；
3. 断言：新 mac 文件与 WIN 版的差异行**只允许**属于上述两块；
4. `node --check` mac 版脚本块通过。

## 4. 回归命令（Windows git-bash）

```bash
# 语法
cd "C:/Users/1/Documents/ChatGPT/软件开发"
python - <<'PY'
import re,pathlib,subprocess,os
for k,p in [("WIN","app/renderer/index.html"),("MAC","lightink-macos/app/renderer/index.html")]:
    t=pathlib.Path(p).read_text(encoding="utf-8")
    m=re.search(r'<script type="module">([\s\S]*?)</script>',t)
    f=pathlib.Path(os.environ["LOCALAPPDATA"],"Temp",f"chk_{k}.mjs"); f.write_text(m.group(1),encoding="utf-8")
    r=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
    print(k,"PASS" if r.returncode==0 else "FAIL "+r.stderr[:200])
PY

# UI 回归（先起 dev 实例）
taskkill /F /IM electron.exe 2>/dev/null
cd app && MSYS_NO_PATHCONV=1 node_modules/.bin/electron . --remote-debugging-port=9560 \
  --user-data-dir="C:/Users/1/AppData/Local/Temp/lightink-dev2" \
  --disable-backgrounding-occluded-windows --disable-renderer-backgrounding \
  --disable-features=CalculateNativeWinOcclusion &   # 后台等 12s
cd ../tools
for f in t119a1.js t119a2.js t119b.js test-v119-eol.js test-v118.js; do
  CDP_PORT=9560 timeout 90 node cdp-eval.mjs --file $f; done
```

全部步骤的输出摘要（PASS/FAIL、失败项列表）记录到 §5。

## 5. 实施记录（CodeBuddy 填写）

> 审核环境：electron 33.4.11 / Windows 11，`app/main.cjs` 默认窗口 1280×840；dev 实例 `--remote-debugging-port=9571/9572/9573` + 临时 `--user-data-dir`（跑完已关闭）。
> 证据类型：CSSOM / computed style 取值（静态核对）+ 实机 CDP 取值。V1/V2/V5 标注"截图"处改用实例取值替代（未截图）。

### 审核结论

- **V1 ✓ PASS**（冷灰底生效）
  - `getComputedStyle(documentElement).getPropertyValue('--glass-strong')` = **`rgba(243,246,249,.93)`**，与标准逐字一致；`--glass`=`rgba(247,249,251,.86)`、`--glass-border`=`rgba(16,24,40,.10)`。
  - 实例实测表面色：`#sidebar`=`rgba(243,246,249,.93)`、`#toolbar`=`rgba(247,249,251,.86)`、`#statusbar`=`rgba(247,249,251,.86)`；三通道满足 B>G>R（冷蓝灰），无暖白/米黄偏色。
- **V2 ✓ PASS**（主按钮品牌投影 → 修复后完整）
  - 静止：`#btnOpenFile`（`.w-btn.primary`）`box-shadow = rgba(23,126,109,.26) 0 1px 2px, rgba(23,126,109,.16) 0 2px 8px`（即 `--accent-sh`）。
  - hover：`.w-btn.primary:hover{box-shadow:var(--btn-sh-hi),var(--accent-sh);transform:translateY(-1px)}`（叠加原有 `filter:brightness(1.06)`）。
  - active：原缺失（按下瞬间品牌色被灰色 `--btn-sh` 覆盖）→ 见修复 F3，现为 `--accent-sh` + `translateY(0)`。
- **V3 ✓ PASS**（修复后）
  - 静止 `--btn-sh`：`#btnPalette`(.tbtn.search)、`#btnNewDoc`(.side-foot button)、`.dlg-btns button`、`.shelf-btn` 实测均为 `rgba(16,24,40,.06) 0 1px 2px, rgba(16,24,40,.05) 0 1px 3px`。
  - hover 组 `--btn-sh-hi` + `translateY(-1px)`；active 组回 `--btn-sh` + `translateY(0)`；`.w-clear` 遗漏 → 见修复 F4。
- **V4 ✓ PASS**（纯图标按钮常态干净）
  - `.tbtn:not(.search):not(.tgl)`（`#btnSidebar`/`#btnTheme`/`#btnSettings`）与 `.side-ico` 静止 `box-shadow = none`；hover 才出 `--btn-sh`；active 为 `translateY(1px)`。
  - 纯文字 `#btnCloseDoc` 静止 `none`，未被误加投影（符合"避免糊成一团"）。
- **V5 ✓ PASS**（立体感 + 行为未变）
  - `.tbtn.tgl .pill` 静止 = `rgba(16,24,40,.06) 0 0 0 1px inset, rgba(16,24,40,.12) 0 1px 2px`（inset 描边 + 外投影）。
  - CDP 点 `#btnKeepMode`：`aria-checked` `false→true→false`；label `阅读优先→保持编辑→阅读优先`；胶囊底色 `rgb(207,213,220)(--border-strong) → rgb(23,126,109)(--accent) →` 复原；`role="switch"` 保留；`localStorage mdr:keepMode` 正常写入；`#btnAutosave` `aria-checked=true`、`role=switch`、innerHTML 结构未变。
  - 结论：DOM 结构、aria-checked 联动、胶囊样式均未被光影改动破坏。
- **V6 ✓ PASS**（修复后两块严格一致）
  - 静态逐声明比对：`html[data-theme="dark"]` 与 `@media(prefers-color-scheme:dark) html[data-theme="auto"]` 两块**声明数 22:22、声明序列完全相同**。
  - 修复前：auto 块多一行重复 `--edit-bg:#202324;`，且新增 3 行缩进误为 2 空格 → 见修复 F1。
  - 实例取值（dark）：`--glass rgba(24,27,31,.72)`、`--glass-strong rgba(28,32,37,.86)`、`--surface #23272c`、`--surface2 #2b3036`、`--border #2c3137`、`--border-strong #3a4048`、阴影为纯黑低透明版；切 dark 后 `#sidebar`=`rgba(28,32,37,.86)`、`#toolbar`=`rgba(24,27,31,.72)`。
  - `auto` 分支经 CSSOM 文本核对（当前系统为浅色，未做系统级深色仿真）。
- **V7 ✓ PASS**（修复后 transform 全关）
  - 修复前 reduced-motion 只关了 hover 位移，漏掉 `.tbtn:not(.search):not(.tgl):active,.side-ico:active{translateY(1px)}`（无动画偏好下图标按钮按下仍位移 1px）→ 见修复 F2。
  - 现规则：`.tbtn.search:hover,…, .w-btn.primary:hover, .tbtn:not(.search):not(.tgl):active, .side-ico:active{transform:none}`；块内 4 处 transform 声明（`translateY(-1px)`×2 组、`translateY(1px)`×1、`translateY(0)`×1）全部被覆盖，另有全局 `@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`。
- **V8 ✓ PASS**
  - `.tbtn` 基础规则可解析：实例 `document.styleSheets` 中存在 `selectorText === '.tbtn'`，解析结果含 `display:inline-flex … height:30px; padding:0 8px … flex:0 0 auto; white-space:nowrap`（未被多写 `}` 吞掉）。
  - 1280 宽实例（侧栏展开）：`#toolbar.scrollWidth == clientWidth == 1011`（无裁切）；11 个子项全部落在工具栏 40–84 条带内的 46–78 区间（单行），两两 rect **无相交（overlaps=[]）**，最右缘 1272 < 1280；`#toolbar.left=268`（=`--sidebar-w`）。
  - 登记偏差：`.tbtn` 基础规则被追加 `flex:none;white-space:nowrap`、`padding 9px→8px`，见遗留问题 1。
- **V9 ✓ PASS**
  - 主 `<style>`（去注释）花括号 **283/283 配平**；MAC 版 286/286（+3 = mac 适配 3 条规则）。
  - `node --check`（提取 `<script type="module">`）：**WIN PASS、MAC PASS**（无 stderr）。

### 修复内容（如有）

| # | 关联 | 位置 | 问题 | 修法 |
|---|---|---|---|---|
| F1 | V6 | `app/renderer/index.html` 47–63（auto 深色块） | 该块多一行重复声明 `--edit-bg:#202324;`，新增的 3 行阴影变量缩进为 2 空格 → 与显式 dark 块声明文本不一致 | 删除重复行；缩进统一为 4 空格 → 两块 22:22 严格一致 |
| F2 | V7 | 同文件 reduced-motion 块（`@media (prefers-reduced-motion: reduce)`） | `transform:none` 列表缺 `.tbtn:not(.search):not(.tgl):active,.side-ico:active`，无动画偏好下图标按钮按下仍位移 1px | 将这两个选择器追加进 `transform:none` 列表 |
| F3 | V2 | 同文件 `.w-btn.primary:hover` 之后 | 通用 `.w-btn:active{box-shadow:var(--btn-sh)}` 同特异度下覆盖主按钮，按下瞬间品牌色投影变成灰色，不符"active 回收到静止态" | 新增 `.w-btn.primary:active{box-shadow:var(--accent-sh);transform:translateY(0)}`（置于 `:hover` 之后，保证 `:hover:active` 时仍胜出） |
| F4 | V3 / §1.2 | 同文件静止态投影选择器列表 | §1.2 静止态清单含 `.w-clear`，落地时只在 transition/hover 组出现，缺静止投影 | 将 `.w-clear` 补入 `box-shadow:var(--btn-sh)` 选择器列表 |
| F5 | 需求原文 §2 覆盖范围 | 同文件静止态投影选择器列表 | 需求原文"覆盖范围（至少）"含"设置抽屉里的开关 `.switch`"，§1.2 未列且实测静止 `box-shadow:none`（用户原话为"所有按键带光影"） | 将 `.switch` 补入静止态投影列表（与 `.tbtn.tgl .pill` 同量级，不动 DOM/交互）。**若 PM 认为此处刻意留白，回退这一个选择器即可** |

修复后复测：F2/F3/F4/F5 均在实例 CSSOM 中确认生效（`.switch` 静止 = `rgba(16,24,40,.06) 0 1px 2px, rgba(16,24,40,.05) 0 1px 3px`；`.w-btn.primary:active{box-shadow:var(--accent-sh);transform:translateY(0)}`；reduced-motion 列表含 `:active` 项）。

### 回归输出摘要

1. **语法（§4 第一段命令）**：`WIN PASS` / `MAC PASS`（`node --check`，脚本 46,213 / 46,930 字符，无 stderr）。
2. **花括号配平**：WIN 283/283、MAC 286/286，均配平。
3. **mac 同步断言（§3.3）**：**PASS** —— 以 WIN 全文为基座回贴两块后，`difflib` 逐行比对：MAC 相对 WIN 的差异行共 **19 行且全部属于两块平台适配**（CSS 4 行 / JS 15 行），WIN 侧独有行 **0**；插入位置断言通过（CSS 块在 `.win-controls{display:flex;height:100%}` 之前；JS 块在 `/* ---------- 启动 ---------- */` 之后、`applySettings(); applyTheme();` 之前）。行数 MAC 1804 = WIN 1785 + 19；两版行尾统一 CRLF（0 个裸 LF）；两版 `git diff --stat` 完全一致（103 insertions / 34 deletions），说明回贴未夹带其他差异。
4. **UI 回归（§4 第二段，1280×840 dev 实例，CDP 9573）**：
   - `t119a1.js`：**10/10 ✓，errors 0**（工具栏右簇、开关相邻不重叠 `keep.right=771 / auto.left=776`）。
   - `t119a2.js`：首轮 5/7（✗「最近打开列表已渲染 — 0 项」「侧栏搜索可过滤」）；**原因为全新 user-data-dir 无历史**；产生历史后重跑 **7/7 ✓**（recents 4 项）。
   - `t119b.js`：首轮 14/15（✗「最近打开含相对时间 — 空」，同上）；重跑 14/15，唯一 ✗ 为「图标尺寸 80px — 0×0」——此时已打开文档、欢迎页 `display:none`，属预期；无文档态首轮该步为 ✓ 80×80。
   - `test-v119-eol.js`：**pass:true，7/7 ✓**（CRLF/LF 识别、打开不写盘、编辑后落盘）。
   - `test-v118.js`：**pass:true，25/25 ✓**（切文档脏检查/三按钮弹窗/落盘分支全通过）。
   - 结论：本次仅 CSS 改动 + mac 回贴，未见任何功能回归；所有 ✗ 均可由"空 profile / 欢迎页隐藏"状态解释。
5. **附带影响**：执行 §4 的 EOL 用例会向 `tools/eol-crlf.md`、`tools/eol-lf.md` 各追加一行（该用例自身行为，本次 11:59 产生），两文件现为 `+2` 行工作区状态；如需干净工作区请由 PM 决定是否 `git checkout`。

### 遗留问题

1. **`.tbtn` 基础规则被追加排布属性（需 PM 确认）**：落地改动给基础规则加了 `flex:none;white-space:nowrap`、`padding:0 9px→0 8px`，属于 §2 禁止事项点名的 `flex/white-space/padding`。但它是 V8「单行不换行」的承重项（`.tbtn` 为 flex 子项，中文文本 min-content 可退化到单字宽，缺 `white-space:nowrap` 会被压行），故本轮回审**保留未回退**，仅登记偏差；本轮我本人未再改动这些属性。
2. **需求原文列出的 `.tbtn.mode-lock` 在主渲染层不存在**（`grep` 0 命中）→ 该项 N/A，是否需要补实现由 PM 判断。
3. `.tbtn.search kbd` 在同段被声明两次（一次 `border/background/padding`，一次 `margin-left:auto`），无功能影响，建议后续合并为一条。
4. 未出截图：V1/V2/V5 要求里的"截图"用实例 computed style + CDP 取值替代；系统级深色（`prefers-color-scheme:dark` + `auto`）未做仿真，仅做 CSSOM 文本核对。
5. 本次启动的三个 dev 实例已全部关闭（按 `--remote-debugging-port=957*` 精确过滤清理，未使用 `taskkill /IM electron.exe`，未影响其他 electron 进程）。