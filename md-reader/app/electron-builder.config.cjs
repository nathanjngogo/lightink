/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'app.lightink.reader',
  productName: 'LightInk',
  directories: { output: 'dist' },
  files: ['main.cjs', 'preload.cjs', 'renderer/**/*'],
  artifactName: '${productName}-Setup-${version}.${ext}',
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
    shortcutName: 'LightInk 轻墨',
  },
};
