/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.local.mdreader',
  productName: 'MD 阅读器',
  directories: { output: 'dist' },
  files: ['main.cjs', 'preload.cjs', 'renderer/**/*'],
  win: {
    icon: 'build/icon.ico',
    target: [{ target: 'nsis', arch: ['x64'] }],
    fileAssociations: [
      { ext: 'md', name: 'Markdown 文档', description: 'Markdown 文档', role: 'Editor' },
      { ext: 'markdown', name: 'Markdown 文档', description: 'Markdown 文档', role: 'Editor' },
    ],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MD 阅读器',
  },
};
