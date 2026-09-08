# LightInk for macOS (v1.0.15)

macOS 版 LightInk 轻墨。基于 Windows v1.0.15 源码做平台适配，功能一致。

## 在 Mac 上打包（需要一台 macOS 电脑）

```bash
# 1. 把整个 lightink-macos 文件夹拷到 Mac（U盘/网盘/scp 均可）

# 2. 安装依赖（需要 Node.js ≥ 18）
cd lightink-macos/app
npm install

# 3. 开发运行（可选，先看效果）
npm run dev

# 4. 打包（产出 .dmg + .zip，同时支持 Apple Silicon 和 Intel）
npm run dist:mac
```

产物在 `app/dist/` 下：
- `LightInk-1.0.15-macOS.dmg`（arm64 + x64 各一个，或 universal）
- 对应 `.zip`（用于 GitHub Release 自动更新时可上传）

## macOS 平台适配说明（相对 Windows 版的差异）

| 项目 | Windows | macOS |
|---|---|---|
| 窗口按钮 | 自绘最小化/最大化/关闭 | 原生交通灯（红黄绿），自绘按钮隐藏 |
| 关闭窗口 | 弹窗选择（托盘/退出/取消） | 红色按钮直接关窗口，App 驻留 Dock（mac 惯例） |
| 退出方式 | 右上角✕ → 退出 | `Cmd+Q` 或菜单栏 LightInk → Quit |
| 托盘 | 系统托盘常驻 | 无需托盘（Dock 常驻），`activate` 事件唤回 |
| 文件打开 | 双击关联文件（注册表） | Finder 双击 / `open-file` 事件 |
| 快捷键显示 | Ctrl K / Ctrl S | ⌘K / ⌘S（UI 自动替换显示） |
| 最大化 | maximize | 全屏切换（fullscreen） |
| 文件关联 | NSIS 注册 | Info.plist `CFBundleDocumentTypes`（.md/.markdown/.txt） |
| 签名 | 无签名 | ad-hoc（`identity: null`），无需 Apple 开发者账号即可本机运行 |

> 分发给别人时，未签名 app 首次打开需右键 → 打开，绕过 Gatekeeper。若有 Apple Developer 账号，在 `electron-builder.config.cjs` 中把 `identity: null` 改为证书名并加 `notarize` 配置。

## 目录结构

与 Windows 版相同：`app/`（Electron 主进程 + renderer）+ `vendor-src/`（依赖打包源）。渲染层资产（Crepe bundle、KaTeX、主题 CSS）已全部 vendored，克隆即可离线构建。
