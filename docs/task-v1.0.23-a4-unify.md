# 任务书 v1.0.23 —— 取消新建文档 A4 纸面，统一常规版心

> 派发：Hermes（PM）→ CodeBuddy（代码工程师）
> 项目根：`C:/Users/1/Documents/ChatGPT/软件开发`
> 日期：2026-09-29

## 0. 需求（用户原话转述）

「新建页面打开的纸张是 A4 尺寸，太小。希望新建时的纸张宽度与打开已有文档的纸张宽度一致。新建页面的体验要与阅读页面的体验一致。」

## 1. 现状（PM 已勘察，直接采信）

- `app/renderer/index.html` 内：
  - `createNewDoc()` 里有一行 `$('#editorWrap').classList.add('a4-paper');   // 新建文档：A4 纸面`（约 @64683 字符偏移处）——**这是唯一加 A4 类的地方**。
  - `closeDoc()` 里有一行 `$('#editorWrap').classList.remove('a4-paper');`——保留不动（防御性复位）。
  - CSS 中 `#editorWrap.a4-paper{...}` 整段（约 @12620 起，含深浅主题变体、print 规则）——**保留不删**。类不再被添加后这些规则自然失效，留着零风险；删除反而是无收益的大 diff。
- `doOpenDoc()`（打开已有文档）本来就不加 A4 类，走常规版心（宽度 = 设置里的「版心宽度」em 值）。

## 2. 改动要求（最小化）

1. **删除** `createNewDoc()` 中 `$('#editorWrap').classList.add('a4-paper');   // 新建文档：A4 纸面` 这一行（整行删除）。
2. **不要**改其他任何代码：closeDoc 的 remove 保留；CSS 的 a4-paper 规则块全部保留；IPC、守卫、自动保存链路不动。
3. 同步 mac 版 `lightink-macos/app/renderer/index.html` 的同一行删除（mac 版结构为 WIN 基座 + 平台适配块，仅删同名一行；删除前 grep 确认 mac 版该行存在且上下文一致）。
4. `node --check` 两版 renderer 内嵌模块脚本（模板：抽取 `<script type="module">` 体到临时文件再检查）必须 PASS。

## 3. 验收标准（PM 将用 CDP 独立复核，自报不算）

| # | 标准 |
|---|---|
| N1 | 新建文档后 `document.querySelector('#editorWrap').classList.contains('a4-paper') === false` |
| N2 | 新建文档与打开已有文档的 `.ProseMirror` 实测宽度（getBoundingClientRect().width）完全一致 |
| N3 | 新建文档背景与常规文档一致（无白纸+阴影的纸面观感） |
| N4 | 打开已有文档、切换守卫、保存链路行为不变（v1.0.18/19 回归不破） |
| N5 | 两版 index.html 中 `a4-paper` 仅剩：CSS 规则、closeDoc remove、注释——**不得再有 classList.add('a4-paper')** |
| N6 | 两版语法 PASS；mac 与 win 该函数差异仅平台适配块 |

## 4. 边界

- 不改 `docs/`、README、三份说明书（说明书由 PM 另行同步）。
- 不改版本号、不打包（PM 负责发布）。

## 5. 完成后

把改动摘要（删了哪行、两版是否一致）写入本文件「实施记录」，输出一行 `A4_DONE + 结论`。

---

## 实施记录

（CodeBuddy 填写）