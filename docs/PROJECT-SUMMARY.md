# LightInk 项目总结（2026-09-08）

## 概览
- **定位**: Windows 本地 Markdown 编辑器+阅读器（本地优先、离线可用、数据不出本机）
- **形态**: Electron 33 + Milkdown Crepe（ProseMirror WYSIWYG），无边框自绘标题栏，Typora 式体验
- **仓库**: github.com/nathanjngogo/lightink（Public / MIT / 英文 README）
- **规模**: 49 commits / 164 文件 / 15 个 GitHub Releases（各含 Setup exe 84MB + portable zip 118MB）
- **本地路径**: `C:\Users\1\Documents\ChatGPT\软件开发\`（git 根；项目文件 2026-09-08 已从 md-reader/ 子目录上移至仓库根）

## 版本时间线
| 版本 | 主题 |
|---|---|
| v1.0.0 | 首发：三模式(阅读/编辑/源码)、自动保存、阅读位置记忆、Ctrl+F、导出 HTML/PDF、毛玻璃 UI |
| v1.0.1 | 最近记录管理（单条移除/全部清除） |
| v1.0.2 | 书架2.0(自定义分类)、新建md、txt 关联、阅读优先、关闭守卫 |
| v1.0.3 | 冷启动双击关联文件直进阅读模式（ack重试+提前注册+排队） |
| v1.0.5 | 移除旧示例书架；关闭守卫三选项(取消/不保存/保存)+保存地址 |
| v1.0.6 | 常驻托盘+关闭弹窗(最小化托盘/退出/取消+记住选择 settings.closeAction) |
| v1.0.7 | 修 askText 未绑 dlgCancel（重命名/新建弹窗取消无反应） |
| v1.0.8 | 新建文档 A4 纸面编辑区(794×1123, 超页无限延伸) |
| v1.0.9 | 深色主题 A4 纸面/编辑背景统一深色(修显式 dark 缺 --edit-bg) |
| v1.0.10 | 修欢迎页「打开文件夹」→书架2.0导入式 |
| v1.0.11 | 新建弹窗只命名；退出弹窗完整可编辑保存路径+目录自动创建 |
| v1.0.12 | 命令面板入口居中加宽(320px胶囊/弹层640px)；关闭文档按钮移工具栏 |
| v1.0.13 | 修弹窗状态泄漏(askText/askConfirm 打开前强制复位标准形态) |
| v1.0.14 | 全局 [hidden]{display:none!important}（.dlg-dir flex 曾覆盖 hidden 致地址行未隐藏） |
| v1.0.15 | A4 纸面宽度随内容自适应(fit-content, min794/上限1400, 双向伸缩) |

## 架构要点
- `app/main.cjs`: app:// 协议、单实例锁+second-instance(握手ack+重试)、close 拦截→渲染层弹窗、Tray、settings/shelf/recent IPC、printToPDF(60s超时)
- `app/preload.cjs`: contextBridge → window.mdr（文件/书架/设置/窗口控制/托盘）
- `app/renderer/index.html`: 单文件 UI+逻辑；vendored Crepe bundle + 主题 CSS（离线可用）；KaTeX/Mermaid
- 文件关联: .md/.markdown/.txt → ProgId "Markdown Document"（曾被 Notion 抢占，2026-09-07 修复注册表）
- 图标: 用户设计稿 PIL 像素级裁切（roundrect 边界检测），ico 七档尺寸
- 数据: `%APPDATA%\LightInk\{recent,shelf,settings}.json`

## 验证方法论（重要经验）
- CDP 实测: dev 启动 `npx electron . --remote-debugging-port=93xx`，`tools/cdp-eval.mjs` 执行断言
- 打包版必须用 `dist/win-unpacked/LightInk.exe` 端到端复测（dev 通过 ≠ 打包通过）
- UI 断言要看**渲染结果**(getComputedStyle + offsetParent)而非属性值（v1.0.14 教训）
- 打包: `npx electron-builder --win nsis`；dist/win-unpacked 被占用时删产物保留骨架重打
- 发布: API 建 release → uploads 传资产 → size-match 校验；约定式提交并 push
- 原生对话框(openDirDialog)会阻塞 CDP 调用——测试需绕开或独立会话

## GitHub 整理（2026-09-08）
- 英文 README（Why / Features / Install / Development / Layout / License）
- description 英文一句话 + homepage 指向 Releases + 12 topics（markdown-editor, wysiwyg, electron, milkdown, windows, offline-first, local-first, katex, mermaid, note-taking, chinese, markdown-reader）
- 仓库根结构修正: md-reader/* 上移至 repo 根（git mv 保留历史）

## 说明书
- 三处同步: `docs/使用说明书.md`（仓库）+ `D:\Hermes Agent工作区\产出\LightInk 使用说明书.md` + `LightInk 说明书.html`

## macOS 版（2026-09-08）
- 独立文件夹 `lightink-macos/`（app + vendor-src + LICENSE/README + MAC-BUILD-GUIDE.md）
- 平台适配：原生交通灯（自绘按钮隐藏/CSS data-platform=mac）、Cmd 快捷键显示（⌘替换）、open-file 事件接 Finder 打开、应用菜单(Cmd+Q/复制粘贴)、close 直关窗口驻留 Dock、fileAssociations 走 Info.plist、dmg+zip 双架构(arm64/x64)、ad-hoc 签名
- 打包必须在 Mac 上执行：`npm install && npm run dist:mac`（Windows 无法打包 mac 安装包，Apple 工具链限制）

## 待办/已知
- GitHub PAT（ghp_IB...）已完成使命，用户应吊销
- 用户机 .md 关联若再被 Notion 抢占，需注册表指回 LightInk
- v1.0.4 版本号被跳过（1.0.3 → 1.0.5）
