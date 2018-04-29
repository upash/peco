const path = require('path')
const slash = require('slash')

module.exports = class OfflinePlugin {
  constructor(pwaEnabled) {
    this.pwaEnabled = pwaEnabled
  }

  apply(api) {
    api.chainWebpack(config => {
      config.plugin('constants').tap(([options]) => [
        Object.assign(options, {
          __PWA_ENABLED__: JSON.stringify(this.pwaEnabled !== false)
        })
      ])
    })

    api.enhanceAppFiles.add(slash(path.join(__dirname, 'pwa-inject.js')))

    api.configureDevServer(app => {
      app.use(require('./noop-sw-middleware')())
    })

    api.hooks.add('onGenerated', async () => {
      const { generateSW } = require('workbox-build')
      await generateSW({
        swDest: api.resolvePecoDir('website', 'sw.js'),
        globDirectory: api.resolvePecoDir('website'),
        globPatterns: [
          '**/*.{js,css,html,png,jpg,jpeg,gif,svg,woff,woff2,eot,ttf,otf}'
        ]
      })
    })
  }
}
