/**
 * @type {import('electron-builder').Configuration}
 * macOS build config — build on a Mac with: npm run dist:mac
 */
module.exports = {
  appId: 'app.lightink.reader',
  productName: 'LightInk',
  directories: { output: 'dist' },
  files: ['main.cjs', 'preload.cjs', 'renderer/**/*'],
  artifactName: '${productName}-${version}-macOS.${ext}',
  appImage: { artifactName: '${productName}-${version}-linux.${ext}' },
  mac: {
    icon: 'build/icon.png',           // icns is generated automatically from the 1024px png
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },   // Apple Silicon + Intel
      { target: 'zip', arch: ['arm64', 'x64'] },
    ],
    category: 'public.app-category.productivity',
    darkModeSupport: true,
    // Universal builds need both arches downloaded by electron-builder automatically.
    // Ad-hoc signing (no Apple Developer account): identity: null keeps the app runnable.
    identity: null,
    extendInfo: {
      NSDocumentsFolderUsageDescription: 'LightInk needs access to your Documents folder to open and save Markdown files.',
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: 'Markdown Document',
          CFBundleTypeRole: 'Editor',
          LSHandlerRank: 'Owner',
          LSItemContentTypes: ['net.daringfireball.markdown'],
        },
        {
          CFBundleTypeName: 'Markdown Text',
          CFBundleTypeRole: 'Editor',
          LSHandlerRank: 'Alternate',
          LSItemContentTypes: ['public.plain-text'],
        },
      ],
      CFBundleTypeExtensions: ['md', 'markdown', 'txt'],
    },
  },
  dmg: {
    title: 'LightInk ${version}',
    contents: [
      { x: 130, y: 220 },                       // app icon position
      { x: 410, y: 220, type: 'link', path: '/Applications' },  // Applications symlink
    ],
  },
};
