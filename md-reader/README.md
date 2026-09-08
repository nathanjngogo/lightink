<p align="center">
  <img src="app/build/icon.png" width="128" alt="LightInk">
</p>

<h1 align="center">LightInk</h1>

<p align="center">
  <strong>A local-first Markdown editor & reader for Windows</strong><br>
  WYSIWYG editing · Auto-save · Works fully offline · Your data never leaves your machine
</p>

<p align="center">
  <a href="#features"><img alt="Features" src="https://img.shields.io/badge/features-12%2B-177e6d"></a>
  <img alt="Platform" src="https://img.shields.io/badge/Windows-10%2F11-blue">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-33-47848F">
  <img alt="Milkdown" src="https://img.shields.io/badge/Milkdown-Crepe-e91e63">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green">
</p>

---

## Why LightInk?

Most Markdown apps force you to choose between a plain text editor and a heavyweight note database. LightInk takes the third path: **double-click any `.md` file on your disk and read it like a document, edit it like a page.** No account, no cloud, no index — just your files.

## Features

- **Three modes** — Read (opens in read mode by default) → Edit (WYSIWYG) → Source, switch with one click
- **A4 paper canvas** — New documents open on a true A4 page (210×297mm). Content taller than one page flows endlessly; paste a wide table or code block and the page **widens to fit**, then shrinks back when it's gone
- **Bookshelf** — Organize documents into custom folders (create / rename / delete), or one-click import an entire disk folder
- **New from scratch** — Create Markdown in-app; on close, pick the filename and save location (full path, editable, auto-creates missing folders)
- **Auto-save** — Writes back to the original file 0.9s after you stop typing; `Ctrl+S` anytime
- **Reading position memory** — Every file remembers where you stopped; reopening restores your scroll position
- **In-document search** — `Ctrl+F` with instant highlight via the CSS Custom Highlight API
- **Export** — Self-contained HTML (inline styles, KaTeX fonts and images) or print-ready PDF
- **Full syntax** — GFM, KaTeX math, Mermaid diagrams, code highlighting, footnotes, task lists
- **System tray** — Close to tray and keep it running in the background; double-click any associated file to bring the window back
- **Dark mode** — Light / dark / follow-system, with a unified dark editing canvas
- **Fully offline** — All editor assets are vendored; clone and run without internet

## Install

Grab `LightInk-Setup-x.y.z.exe` from the [Releases](../../releases) page and run it — no admin rights needed. File associations for `.md` / `.markdown` / `.txt` are registered automatically, so double-clicking a Markdown file opens LightInk in reading mode.

> The installer is unsigned. If Windows SmartScreen appears, click **More info → Run anyway**.

## Development

```bash
git clone https://github.com/nathanjngogo/lightink.git
cd lightink/app
npm install
npm run dev     # run in development
npm run dist    # build the NSIS installer
```

Editor rendering dependencies are vendored (`app/renderer/vendor/`), so the repo runs offline out of the box. To rebuild the Milkdown Crepe bundle:

```bash
cd vendor-src && npm install && npx esbuild node_modules/@milkdown/crepe/lib/esm/index.js --bundle --format=esm --platform=browser --outfile=../app/renderer/vendor/crepe.bundle.mjs
```

## Project Layout

```
app/                  Electron app (main / preload / renderer)
  build/              Icon assets & generator script (gen-icon.cjs)
  renderer/           UI (single HTML, vendored Milkdown Crepe)
vendor-src/           Dependency source for esbuild bundling
prototype/            Early interaction prototypes & UI drafts
tools/                CDP test scripts & build utilities
docs/                 User manual (Chinese)
```

## License

[MIT](LICENSE) © Nan Jiang
