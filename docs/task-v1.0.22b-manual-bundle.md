# 任务书 v1.0.22b —— 使用说明书打包进应用 + 命令面板入口

> 派发：Hermes（PM）→ CodeBuddy（代码工程师）
> 项目根：`C:/Users/1/Documents/ChatGPT/软件开发`
> 关联：v1.0.22 图标任务（两份可并行/串行执行，均只动各自文件，见 §4）

## 0. 需求

用户要求：说明书要**打包进软件安装包**，随应用分发。PM 决定附加一个**应用内入口**（否则用户看不到随包的说明书）。

## 1. 打包链路（先勘察，再改）

1. 把仓库 `docs/使用说明书.md` 复制为 **`app/manual/使用说明书.md`**（新目录；保留仓库 docs 原件不动——那是 GitHub 公开入口）。
2. `app/electron-builder.config.cjs` 的 `files` 现为 `['main.cjs','preload.cjs','renderer/**/*']`——`app/` 即打包 asar 的根。加一项 `'manual/**/*'`。
3. mac 同步：复制 `lightink-macos/app/manual/使用说明书.md`；改 `lightink-macos/app/electron-builder.config.cjs` 的 `files`（同样加 `'manual/**/*'`）。
4. 两份 md 逐字节一致，且保持 **CRLF**（源文件就是 CRLF，直接二进制复制，不要转换）。

## 2. 应用内入口（渲染层 + 主进程 + preload）

1. **主进程** `app/main.cjs` 新增 IPC：
   `ipcMain.handle('manual:read', () => fs.readFileSync(path.join(__dirname, 'manual', '使用说明书.md'), 'utf8'))`
   返回 `{ name: 'LightInk 使用说明书.md', text: <文件内容> }`；读失败返回 `{ error: '说明书缺失' }`（不要抛崩）。
2. **preload** `app/preload.cjs`：按现有 contextBridge 风格暴露 `readManual: () => ipcRenderer.invoke('manual:read')`（通道名对齐）。
3. **渲染层** `app/renderer/index.html`：
   - 命令面板列表新增一项：`{ t:'查看使用说明书', k:'', run: openManual }`（找到现有命令数组，样式对齐；插在「打开文件」附近）。
   - 实现 `async function openManual()`：`const m = await window.mdr.readManual(); if (m?.text) requestOpenDoc({ id:'manual:lightink', name:m.name, text:m.text }); else toast('说明书不可用');`
     （复用 `requestOpenDoc` → 未保存守卫自动生效；打开为阅读模式，可切编辑但改了也存不回包内——无需特殊处理。）
4. mac 副本（`lightink-macos/app/` 三个文件）同步——mac main.cjs 的 IPC 结构略有差异（open-file 事件等），**逐文件比对后移植**，不要整文件复制覆盖。

## 3. 验收标准

| # | 标准 | 取证 |
|---|---|---|
| H1 | `node --check` main.cjs / preload.cjs / 两版 renderer 模块脚本，全 PASS | 命令输出 |
| H2 | 渲染层测试：起 dev 实例（`--remote-debugging-port=95xx --user-data-dir=<temp>` 带三个 `--disable-*` 参数），CDP 执行 `window.mdr.readManual().then(m=>m.text.length)` > 10000 且含「LightInk 轻墨 使用说明书」 | CDP 输出 |
| H3 | 命令面板执行「查看使用说明书」后标题栏显示 `LightInk 使用说明书.md`、编辑区渲染出目录表、body 有 `data-doc-open` | CDP |
| H4 | `git check-ignore` 确认 `app/manual/*.md` 未被忽略；`asar` 打包链路配置含 `manual` | 命令输出 |
| H5 | Win/mac 的 manual md 逐字节一致且 CRLF；两版 builder config 均含 `'manual/**/*'` | python 断言 |
| H6 | mac main/preload 与 win 版的差异行仍只属 mac 平台适配（open-file/activate/Dock），无意外丢失 | 逐对 diff |

## 4. 边界

- 与图标任务（task-v1.0.22-icon-replace.md）互不相干，但**共同文件**只有 `app/renderer/index.html`（本任务）——图标任务不碰它。若两个任务都要跑，先跑图标再跑本任务，或分开两次派发，**不要在同一轮同时改 index.html 与 gen-icon 之外的共享文件**。
- 不改说明书内容本身（PM 已定稿）；不改 `docs/` 与 `D:\Hermes Agent工作区\产出\` 下的三份手册。
- 渲染层禁 prompt/confirm；toast/requestOpenDoc 均为现有函数，直接复用。

## 5. 完成后

把 H1–H6 实测写入本文件「实施记录」。输出 `MANUAL_DONE + 一句话结论`。

---

## 实施记录

> 实施人：CodeBuddy　日期：2026-09-21
> 前置：图标任务（task-v1.0.22-icon-replace.md）已先跑完，再跑本任务，共享文件 `app/renderer/index.html` 未与图标任务冲突。

### 改动清单（仅本任务涉及的文件，未越界）

| 平台 | 文件 | 动作 |
|---|---|---|
| Win | `app/manual/使用说明书.md` | 新增（二进制复制自 `docs/使用说明书.md`）|
| Win | `app/electron-builder.config.cjs` | `files` 追加 `'manual/**/*'`（其余字段未动）|
| Win | `app/main.cjs` | `registerIpc()` 内新增 `manual:read` handler |
| Win | `app/preload.cjs` | 新增 `readManual` |
| Win | `app/renderer/index.html` | 命令面板新增「查看使用说明书」+ `openManual()` |
| mac | `lightink-macos/app/manual/使用说明书.md` | 新增（同上）|
| mac | `lightink-macos/app/electron-builder.config.cjs` | `files` 追加 `'manual/**/*'` |
| mac | `lightink-macos/app/main.cjs` | 同 Win，**定位后单块插入**（非整文件覆盖）|
| mac | `lightink-macos/app/preload.cjs` | 同 Win |
| mac | `lightink-macos/app/renderer/index.html` | 同 Win |

未触碰：`docs/`（含 `docs/使用说明书.md` 原件，逐字节未变）、`README.md`、三份产出手册、`electron-builder` 其余字段。

### H1 `node --check` 全 PASS ✅

```
app/main.cjs                               PASS
app/preload.cjs                            PASS
lightink-macos/app/main.cjs                PASS
lightink-macos/app/preload.cjs             PASS
renderer-win.mjs (module script 抽取)       PASS
renderer-mac.mjs (module script 抽取)       PASS
```
说明：两版 `index.html` 的 `<script type="module">` 块（win 997 行 / mac 1012 行）用正则抽取到临时 `.mjs` 后 `node --check`；抽取时已确认脚本块内用于导出 PDF 的 `katexJs` 模板字符串把 `</script` 拆成了 `</` + `` ` `` + `script>`，不会提前截断。

### H2 渲染层 IPC 取数 —— ⚠️ 未执行（无 GUI/CDP 环境），证据入口留给 PM

本机为无显示会话，起不了 dev 实例。请 PM 执行：

```bash
cd app && npx electron . --remote-debugging-port=9522 \
  --user-data-dir="$TEMP/lightink-h2" --disable-gpu --disable-software-rasterizer --disable-dev-shm-usage
# 然后对 http://127.0.0.1:9522/json 取 page 的 webSocketDebuggerUrl，Runtime.evaluate：
#   window.mdr.readManual().then(m=>({len:m.text.length, title:m.text.includes('LightInk 轻墨 使用说明书'), name:m.name}))
```

**静态预判（已实测，供 PM 判读阈值）**：主进程读取路径 `path.join(__dirname,'manual','使用说明书.md')` 在本机实跑通：
`app → OK 8777 chars`、`lightink-macos/app → OK 8777 chars`，标题串命中 `true`。

> ⚠️ **H2 阈值需修订**：任务书写的是 `m.text.length > 10000`，但说明书实际只有 **8777** 个 UTF-16 码元（19118 字节 UTF-8，8773 个码点）。按现阈值 H2 **必然判失败**，且与实现无关。建议把阈值改为 `> 8000`（或改判 `text.includes('LightInk 轻墨 使用说明书')` 为准）。这个是 PM 定稿文档与实现之间的口径问题，请确认后我再改或直接按新阈值核。

### H3 命令面板入口 —— ⚠️ 未执行（同上），证据入口留给 PM

```js
// 同一 CDP 会话：
// 1) 打开命令面板后执行
//    [...document.querySelectorAll('#palList .p-item')].map(e=>e.textContent)
//    → 应含 '查看使用说明书'
// 2) 点击该项（或 __palClick）后检查：
//    document.querySelector('#docTitle').textContent      → 'LightInk 使用说明书.md'
//    document.body.dataset.docOpen                         → 存在
//    document.querySelector('.crepe-editor, #editor') 内含目录表（<ol>/<ul> 且 10 个「#N-」锚点链接）
```

静态已核（两版均通过）：

| 断言 | win | mac |
|---|---|---|
| `async function openManual()` 存在 | ✅ | ✅ |
| 命令项 `{ t:'查看使用说明书', k:'', run:openManual }` 存在 | ✅ | ✅ |
| 命令项紧跟「打开文件」之后 | ✅ | ✅ |
| 调 `window.mdr.readManual()` | ✅ | ✅ |
| 复用 `requestOpenDoc({id:'manual:lightink', name:m.name, text:m.text})` | ✅ | ✅ |
| 无内容时 `toast('说明书不可用')` | ✅ | ✅ |
| 该函数内无 `prompt/confirm` | ✅ | ✅ |

链路通道名对齐核验：`preload.readManual → invoke('manual:read')`（win/mac 同）＝ `main ipcMain.handle('manual:read')`（win/mac 同）；返回值 `{name:'LightInk 使用说明书.md', text}`，异常兜底 `{error:'说明书缺失'}`（两版一致）。

### H4 打包链路 ✅

```
$ git check-ignore -v app/manual/使用说明书.md lightink-macos/app/manual/使用说明书.md
（无输出）→ exit=1，即**未被忽略**
$ git status --short | grep manual
?? app/manual/
?? lightink-macos/app/manual/          → 已被 git 跟踪为新增（会进仓库）
```

builder config 真 `require()` 后的 `files`：

```
./app/electron-builder.config.cjs                -> ["main.cjs","preload.cjs","renderer/**/*","manual/**/*"]  含 manual/**/*: true
./lightink-macos/app/electron-builder.config.cjs -> ["main.cjs","preload.cjs","renderer/**/*","manual/**/*"]  含 manual/**/*: true
```

asar 语义核验：electron-builder 的 `files` 相对 `app/`（asar 根）展开，故 asar 内条目为 `manual/使用说明书.md`（不是 `app/manual/...`）。运行时 `__dirname` 即 asar 根，`path.join(__dirname,'manual','使用说明书.md')` 解析为 `<...>/app.asar/manual/使用说明书.md`，由 Electron 的 asar patch 透明读取，**路径成立**（本轮已用普通 node 按同一相对路径实读通过，见 H2 静态预判）。

### H5 说明书一致性与 CRLF ✅

| 文件 | 字节 | CRLF | 孤立 LF | sha256 |
|---|---|---|---|---|
| `docs/使用说明书.md`（源，未改） | 19118 | 313 | 0 | `187b03a29ee21b457f38476b7d283c2a84e418314ba0dba56c812ffaa618eaab` |
| `app/manual/使用说明书.md` | 19118 | 313 | 0 | 同上 |
| `lightink-macos/app/manual/使用说明书.md` | 19118 | 313 | 0 | 同上 |

`win == mac` ✅　`win == docs 原件` ✅（证明是二进制复制，无换行转换、无内容改写）
两版 builder config 均含 `'manual/**/*'` ✅

### H6 mac 与 Win 差异行仍只属平台适配 ✅

改动前后「mac 与 win 的平台差异行数」对比（用 `git show HEAD:...` 取改动前）：

| 文件 | 改动前 | 改动后 | 增减 |
|---|---|---|---|
| `main.cjs` | 228 | 228 | **+0** |
| `preload.cjs` | 0 | 0 | **+0** |
| `renderer/index.html` | 19 | 19 | **+0** |

即本次改动**没有新增/丢失任何平台差异行**：新增内容在两侧是同一份代码。
逐对 diff 复核结果：

- `preload.cjs`：两版**逐字节相同**（本次同款单点插入）。
- `main.cjs`：差异仍全部属平台适配——`isMac` 常量、`open-file`（Finder 打开）、`pendingFile`、`trafficLightPosition` / `titleBarStyle: 'hidden'`、mac 关闭行为（红点即关窗）、`buildAppMenu()`、无托盘分支、i18n 文案（`My Shelf` / `PDF` / `HTML` / 注释英文化）。新增 `manual:read` 块在两侧**除 1 行注释外完全相同**（win 中文注释 / mac 英文注释，与该文件整体注释语言策略一致），IPC 通道名、路径、返回结构、兜底分支一致。
- mac 平台适配标记复检全部仍在：`isMac` ✅ `open-file` ✅ `titleBarStyle` ✅ `trafficLightPosition` ✅ `buildAppMenu` ✅ `pendingFile` ✅；renderer 的 `html[data-platform="mac"]` CSS 与 `IS_MAC` 判定块 ✅ 仍在（该块就是上述 19 行差异）。

### 遗留 / 请 PM 决策

1. **H2 阈值 `>10000` 与实物 8777 不符**（见 H2 段），需改口径。
2. H2/H3 因本机无显示环境未跑，命令与断言已备好，可直接复制执行；执行后我把实测数字补进本记录。
3. 未做实际 `electron-builder` 打包（属发布环节，且本机无签名/打包依赖许可），仅静态核到 `files` 配置层。若需产出安装包验证说明书确在 asar 内，建议 PM 在发布机跑 `npm run dist` 后 `npx asar list app/dist/win-unpacked/resources/app.asar | findstr manual`。