# LightInk v1.0.18 任务单：切换文档时保存提示（方案一细化）

## 目标
在保持当前「单文档模式」的前提下，当用户在编辑/源码模式下打开另一个文件时，如果当前文档有未保存的更改，弹出一个三选项对话框，防止误丢失内容。

## 约束
- 不改多文档/多标签页结构，保持单文档模式。
- 仅处理「当前文档未保存且用户打开新文件」的场景。
- 关闭第二个文件后，不自动恢复第一个文件（方案一范围）。
- 保持与现有 `askCloseUnsaved` 对话框视觉一致，按钮文案适配场景。
- 支持 Electron 与 PWA/浏览器环境；在 Electron 下调用 `window.mdr.openFileDialog()` 等桥接。
- macOS 版源码位于 `lightink-macos/app/renderer/index.html`，Win 主源码位于 `app/renderer/index.html`，两者需同步。

## 当前代码位置（Win 版）
- `app/renderer/index.html`
  - 状态变量：`cur`, `dirtyGuard`, `mode`
  - `openDoc(o)` 第 957 行起：打开文档入口
  - `openPath(p)` 第 998 行起：Electron 打开真实文件
  - `createNewDoc()` 第 1016 行起：新建文档
  - `askCloseUnsaved(defaultName)` 第 757 行起：三按钮关闭未保存对话框
  - `guardClose()` 第 1450 行起：关闭守卫
  - `closeDoc()` 第 1432 行起：清理状态

## 变更细节

### 1. 新增状态变量 `pendingOpen`（模块顶部状态区）
在 `let crepe=null, mode='read', cur=null, ...` 同一位置新增：
```js
let pendingOpen = null; // { id, name, text, handle, path }
```
用于临时保存用户想打开的新文档数据。

### 2. 修改 `openDoc`：改为可异步守卫后再执行
将 `openDoc` 拆成两阶段：
- `requestOpenDoc(o)`：先判断是否有未保存内容，有则弹出守卫对话框；无则直接 `doOpenDoc(o)`。
- `doOpenDoc(o)`：原来的 `openDoc` 逻辑，原样保留。

伪代码：
```js
async function requestOpenDoc(o){
  // 如果当前没有打开文档，或当前文档无未保存更改，直接打开
  if (!cur || !dirtyGuard) return doOpenDoc(o);

  // 当前有未保存更改：询问用户
  const choice = await askSwitchUnsaved(cur.name || '未命名.md');
  if (choice === 'cancel' || choice === null) {
    return; // 留在当前文档
  }
  if (choice === 'discard') {
    pendingOpen = o;
    await doOpenDoc(o);
    dirtyGuard = false; // 打开新文档后自然无脏标记
    return;
  }
  if (choice?.action === 'save') {
    // 保存当前文档
    const saveName = choice.name;
    if (!saveName) { toast('名称不能为空'); return; }
    try {
      const target = await window.mdr.writeFileTo(saveName, choice.dir, cur.text);
      dirtyGuard = false;
      await doOpenDoc(o);
    } catch (e) {
      errPush('保存失败：' + (e.message || e));
    }
    return;
  }
}

async function doOpenDoc(o){ ... }
```

说明：
- `askSwitchUnsaved` 与 `askCloseUnsaved` 共用同一 DOM 对话框，但标题和按钮文案需不同。
- 如果当前文档是已有路径（`cur.path` 存在），「保存」分支直接调用 `window.mdr.writeFile(cur.path, cur.text)` 覆盖原文件，不需要弹窗。

### 3. 新增 `askSwitchUnsaved(defaultName)` 对话框函数
放在 `askCloseUnsaved` 旁边。要求：
- 标题：`当前文档有未保存的更改`
- 副标题/提示：`打开新文档前，是否保存当前更改？`
- 三按钮：
  - **取消** → 返回 `'cancel'`，不打开新文档
  - **不保存** → 返回 `'discard'`，直接打开新文档
  - **保存** → 返回 `{action:'save', name, dir}`
- 输入框：默认显示当前文件名（`defaultName`）。
- 地址行：
  - 如果当前文档已有路径 `cur.path`，地址行显示原目录，且只读（或隐藏）。
  - 如果当前文档是新文档（`cur.path` 不存在），地址行可编辑，默认文档目录，支持 📁 按钮选择。
- 复用现有 `#dlg` 结构，注意重置 `innerHTML` 和 `hidden` 状态，避免与 `askText`/`askConfirm`/`askCloseUnsaved` 互相污染。

### 4. 修改 `openDoc` 的调用点
将所有直接调用 `openDoc(o)` 的地方改为 `requestOpenDoc(o)`：
- `openPath(p)` 中：`openDoc(...)` → `requestOpenDoc(...)`
- 书架文件点击处（搜索 `openDoc({` 的全部调用）
- 最近文件点击处
- 欢迎页示例文档点击处（`doc-demo` 等）
- `createNewDoc()` 中：新建文档前，如果当前文档未保存，也应先提示

注意：`createNewDoc` 当前直接创建内存文档。修改后：
```js
async function createNewDoc(){
  if (cur && dirtyGuard) {
    const choice = await askSwitchUnsaved(cur.name || '未命名.md');
    if (choice === 'cancel' || choice === null) return;
    if (choice === 'discard') {
      // 继续新建
    } else if (choice?.action === 'save') {
      // 保存当前
      ...
    }
  }
  // 原有 createNewDoc 逻辑
}
```

### 5. 关闭文档后的状态清理
当前 `closeDoc()` 清理所有状态。因为方案一仍是单文档，关闭第二个文件时不会恢复第一个文件，所以 `closeDoc` 逻辑**不变**。

### 6. 保存辅助函数
在 `preload.cjs` 和 `main.cjs` 中已存在：
- `window.mdr.writeFile(path, text)`
- `window.mdr.openDirDialog()`
- `window.mdr.docCreate(name, dir)` → 返回完整路径

如果当前文档已有 `cur.path`，直接 `window.mdr.writeFile(cur.path, cur.text)`。
如果当前文档无路径，使用 `window.mdr.docCreate(name, dir)` 获取路径后 `writeFile`。

### 7. macOS 版同步
对 `lightink-macos/app/renderer/index.html` 做同样的修改。
该文件目前结构与 Win 版基本一致，注意 `openDoc`/`openPath`/`createNewDoc` 的调用点。

## 测试验收（CDP）
编写 `tools/test-v118.js` 并通过 `tools/cdp-eval.mjs` 验证：

1. 新建文档，输入内容 → 未保存
2. 点击「打开文件」或书架中另一个文件
3. 验证弹出三选项对话框（标题包含「打开新文档前」）
4. 选择「取消」→ 留在当前文档，内容不变
5. 再次打开新文件，选择「不保存」→ 打开新文件
6. 再次新建一个未保存文档，打开新文件，选择「保存」→ 文件保存成功，然后打开新文件
7. 已保存的磁盘文件编辑后未保存，打开新文件 → 弹出对话框，选择「保存」→ 覆盖原文件，然后打开新文件
8. 打开新文件后 `dirtyGuard` 状态正确（新打开的文件无脏标记）
9. 零报错

## 文件清单
- `app/renderer/index.html`（主修改）
- `lightink-macos/app/renderer/index.html`（同步）
- `tools/test-v118.js`（新增测试脚本）
- `RELEASE-NOTES-v1.0.18.md`（发布后新增）

## 版本号
打包并发布为 **v1.0.18**。

## 派发给 codebuddy 时的上下文
请基于当前仓库的 `main` 分支执行修改。当前版本为 v1.0.17，相关代码在 `app/renderer/index.html` 中。Electron 桥接 API 已通过 `window.mdr` 暴露，可直接使用。修改完成后需用 `tools/cdp-eval.mjs` 跑通 `tools/test-v118.js` 测试脚本。

---

## 实施摘要（v1.0.18 实际落地）

> 说明：本任务原计划派发给 CodeBuddy，实际由其 GUI 派发后未产生任何文件改动（`git status` 无变化），改由主对话直接实现。

### 最终实现（比原方案更精简）

| 项 | 原方案 | 实际实现 |
|---|---|---|
| 对话框 | 新增 `askSwitchUnsaved`（独立函数） | 保留（`app/renderer/index.html`，与 `askCloseUnsaved` 同 DOM） |
| 打开入口拆分 | `requestOpenDoc` + `doOpenDoc` | 一致 |
| 守卫条件 | `dirtyGuard` | 改为 `isDirty()`：`dirtyGuard \|\| curDirty`（原条件对磁盘文件恒为 false，无法覆盖用户报告的场景） |
| 脏状态 | 复用 `#docTitle.modified` CSS 类 | 新增显式 `curDirty` 状态变量，`markDirty()` 置位、`saveNow()` 落盘后复位 |

### 关键修复（实现过程中发现）

1. **守卫失效**：`dirtyGuard = !cur.path` 只对新建文档生效，编辑磁盘文件后切换不会提示 —— 用户报告的核心场景。改为显式 `curDirty` 状态机。
2. **空文档回归**：中途改动曾让书架/最近文件/拖拽/冷启动入口绕过 `openPath`（读取文件内容）直接传空文本，会导致文档打开为空白。已全部回退为 `openPath()`，`openPath` 内部再走 `requestOpenDoc`。
3. **脏标记不复位**：`saveNow()` 此前从不清除 `#docTitle.modified`，标记会一直亮着。已改为落盘成功后清除。
4. **Win 版丢失 `window.__askCloseUnsaved` 测试钩子**：已补回。

### 验证（CDP 实测）

- `tools/test-v118.js`：25/25 项通过（含取消/不保存/保存三条路径、放弃的修改未落盘、保存的修改真正落盘、新建文档前守卫）
- `tools/test-v118b.js`：默认配置（自动保存开启）8 项通过（编辑后为脏 → 落盘后复位 → 切换不弹窗）

### 涉及文件

- `app/renderer/index.html`、`lightink-macos/app/renderer/index.html`
- `tools/test-v118.js`、`tools/test-v118b.js`
- `RELEASE-NOTES-v1.0.18.md`
