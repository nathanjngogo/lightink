# 任务：修复「打开文件即被自动保存改写（含行尾 CRLF→LF）」

## 背景与证据

LightInk v1.0.18，Windows 版源码 `app/renderer/index.html`（单文件承载全部渲染层逻辑）。

**实测证据（CDP 复现）**：把一个 CRLF 行尾的 `.md` 文件用 LightInk 打开、**不做任何编辑**，等待约 1 秒后：

- 文件被写回磁盘（状态栏显示「已保存到文件 HH:MM:SS」）
- 行尾从 CRLF 变成 LF：打开前 `CRLF=19 / 裸LF=0`，打开后 `CRLF=0 / 裸LF=19`

复现脚本（可直接跑）：

```bash
# 1) 造一个 CRLF 文件
python -c "import pathlib;p=pathlib.Path('C:/Users/1/Documents/ChatGPT/软件开发/tools/eol-test.md');p.write_bytes('# 标题\r\n\r\n正文\r\n'.encode('utf-8'))"
# 2) 起 dev 实例（注意加防遮挡参数，否则截图/CDP 会挂）
cd app && MSYS_NO_PATHCONV=1 node_modules/.bin/electron . --remote-debugging-port=9522 --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-features=CalculateNativeWinOcclusion
# 3) 打开该文件
cd tools && CDP_PORT=9522 node cdp-eval.mjs "(async()=>{window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/tools/eol-test.md');await new Promise(r=>setTimeout(r,2000));return {eol:document.querySelector('#stEol').textContent};})()"
# 4) 再看字节：CRLF 已消失
```

## 根因

`app/renderer/index.html` 中：

1. `mountEditor(md)` 里注册了 `crepe.on(l=>l.markdownUpdated((ctx,m)=>{ cur.text=m; markDirty(); scheduleOutline(); }))`。
   **Crepe 在初始化/首次渲染时也会触发一次 `markdownUpdated`**，此时用户在界面上什么都没做。
2. `markDirty()` 会 `if(settings.autosave) saveTimer=setTimeout(saveNow,900)`。
3. `saveNow()` 走 `window.mdr.writeFile(cur.path, cur.text)` 把 **Crepe 归一化后的 Markdown**（行尾统一为 `\n`）写回原文件。

结果：**打开即改写**，且行尾被归一化（CRLF 文件变 LF），对用户的文件是意外的静默修改。

## 需要改成什么

### 1. 打开文件不得触发写入

- 文档刚打开（编辑器初始化、首次渲染）阶段产生的 `markdownUpdated` 回调，**不得**标记为「有未保存修改」，也**不得**排入自动保存定时器。
- 只有在**用户真实编辑**（键盘输入、粘贴、点击任务列表勾选框、源码模式 textarea 输入等）之后，才允许标脏与自动保存。

建议实现（可自行判断更稳妥的写法）：引入一个模块级标志（如 `let docLoading=false`）

- `mountEditor` 开始置 `true`，`await crepe.create()` 完成并在 `requestAnimationFrame` 之后置 `false`；
- `markDirty()` 首行：`if(docLoading) return;`

注意不要破坏既有行为：
- v1.0.18 的 `curDirty` / `dirtyGuard` 语义与切换文档守卫（`requestOpenDoc`）必须保持；
- 用户真实编辑后 900ms 自动保存仍要正常工作（`tools/test-v118b.js` 覆盖）；
- 「阅读模式」下 `markdownUpdated` 也不应触发写入。

### 2. 保存时保持原有行尾

- 读取文件时记录该文件的原始行尾：`cur.eol = /\r\n/.test(text) ? 'CRLF' : 'LF'`。
- 写盘前（`saveNow()` 与 `guardSwitchUnsaved()`、`guardClose()` 中所有 `writeFile` 调用点）若 `cur.eol === 'CRLF'`，把待写文本的裸 `\n` 转成 `\r\n` 再写入。
- 新建文档（无 `cur.eol`）按 LF 处理。
- 状态栏 `#stEol` 继续显示当前文档的行尾（`updateDocInfo()` 已有，改造后仍要正确）。

## 验收标准

1. **打开不写盘**：打开任意 `.md` 后 3 秒内不出现「已保存到文件」，磁盘文件 `mtime` 不变；`window.__isDirty()` 为 `false`。
2. **CRLF 保留**：打开 CRLF 文件 → 编辑一处 → 等自动保存 → 磁盘文件仍是 CRLF，且内容含新编辑。
3. **LF 保留**：LF 文件编辑保存后仍是 LF。
4. **编辑仍会保存**：手动输入后 900ms 自动保存照常工作，状态栏显示「已保存到文件 + 时间」。
5. **回归不破**：`tools/test-v118.js`（25 项）与 `tools/test-v118b.js`（8 项）全部通过；`tools/test-v119-ui.js` 的 A/B 两段（工具栏 10 项 + 侧栏 7 项 + 欢迎页/状态栏/交互 15 项）全部通过。
6. `node --check`（提取 `<script type="module">` 内容）通过。

## 约束

- **只改** `app/renderer/index.html`；`lightink-macos/app/renderer/index.html` 由主对话统一同步，不要动。
- 不改动 v1.0.18 已验收的切换文档守卫逻辑与 v1.0.19 新 UI（工具栏右簇「阅读优先 / 自动保存」、侧栏分组、欢迎页、状态栏）。
- Electron 环境无 `prompt`/`confirm`，需要弹窗时用现有 `#dlg` 对话框体系。
- 完成后把改动摘要（改了哪几段、为什么）写到本文件末尾的「实施记录」小节。

## 验证命令

```bash
# 语法
cd "C:/Users/1/Documents/ChatGPT/软件开发"
python - <<'PY'
import re,pathlib,subprocess,os
t=pathlib.Path('app/renderer/index.html').read_text(encoding='utf-8')
m=re.search(r'<script type="module">([\s\S]*?)</script>',t)
f=pathlib.Path(os.environ['LOCALAPPDATA'],'Temp','chk.mjs');f.write_text(m.group(1),encoding='utf-8')
print(subprocess.run(['node','--check',str(f)],capture_output=True,text=True))
PY

# 回归
cd tools && CDP_PORT=9522 node cdp-eval.mjs --file test-v118.js
CDP_PORT=9522 node cdp-eval.mjs --file test-v118b.js
CDP_PORT=9522 node cdp-eval.mjs --file t119a1.js
CDP_PORT=9522 node cdp-eval.mjs --file t119a2.js
CDP_PORT=9522 node cdp-eval.mjs --file t119b.js
```

> 注意：CDP 脚本较长时偶发 `ws timeout`，若整段脚本超时，拆成小段分别执行（见上方 t119a1/a2/b 的拆法）。

## 实施记录

**由主对话（Hermes）实现** —— CodeBuddy 三次派发均零产出（`buddycn chat` 只把会话投递到 GUI，GUI 无窗口/未执行；`git status` 与文件 mtime 均无变化，任务单未被回写）。

改动（`app/renderer/index.html`，macOS 副本已同步）：

1. **打开不写盘**：新增模块级 `docLoading` 标志。`mountEditor()` 进入时置 `true`，用户首次真实交互（`keydown`/`paste`/`cut`/`drop`）或渲染结束后 1200ms 兜底置 `false`；`markDirty()` 首行 `if(docLoading) return;`。→ Crepe 初始化/首帧触发的 `markdownUpdated` 不再标脏、不再排入自动保存。
2. **行尾保持**：`doOpenDoc()` 记录 `cur.eol = /\r\n/.test(cur.text) ? 'CRLF' : 'LF'`；新增 `textForWrite()`，写盘前若 `cur.eol==='CRLF'` 则把裸 `\n` 还原成 `\r\n`。`saveNow()`、`guardSwitchUnsaved()`、`guardClose()` 共 7 处写盘调用点全部改用它。
3. **状态栏**：`#stEol` 优先显示 `cur.eol`（编辑后 `cur.text` 会变 LF，但磁盘仍是原行尾）。
4. **回归兼容**：v1.0.18 切换守卫（`requestOpenDoc`/`isDirty`/`curDirty`）与 v1.0.19 新 UI 均未改动。

验证结果：

- `tools/test-v119-eol.js`（新增）：7/7 通过；磁盘字节核验 —— CRLF 文件编辑保存后仍为 `CRLF=4/裸LF=0` 且含新编辑，LF 文件仍为 `裸LF=4/CRLF=0`
- `tools/test-v118.js` 25/25、`tools/test-v118b.js` 8/8、`tools/test-v119-ui.js`（t119a1 10 + t119a2 7 + t119b 15）全部通过
- 两个渲染层 `node --check` 通过