/**
 * 免安装绿色版（portable）打包配置 —— 与 electron-builder.config.cjs 同源，只改打包形态：
 *  1) target 用 dir（只出文件夹，不生成安装器 / 不需要 wine）
 *  2) asar:false → resources/app/ 是真实文件，改 renderer/index.html 重启即生效
 *  3) 不带 node_modules（main.cjs 只依赖 electron 与 node 内置模块，依赖都是构建期用的）
 *  4) 只保留中英文语言包，体积从 ~315MB 降到 ~250MB
 *
 * 用法：npm run portable
 * 产物：dist/win-unpacked/  （压缩成 zip 即为免安装包）
 */
const base = require('./electron-builder.config.cjs');

module.exports = {
  ...base,
  asar: false,
  files: ['main.cjs', 'preload.cjs', 'renderer/**/*', 'manual/**/*', '!node_modules/**/*'],
  electronLanguages: ['zh-CN', 'en-US'],
  win: {
    ...base.win,
    target: [{ target: 'dir', arch: ['x64'] }],
    // 绿色版不写注册表、不注册文件关联
    fileAssociations: [],
  },
};