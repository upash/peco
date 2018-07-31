const path = require('upath')
const fs = require('fs-extra')

module.exports = class PwaPlugin {
  constructor(pwa) {
    this.pwaEnabled = pwa !== false
    this.pwaOptions = Object.assign(
      {
        notifyUpdates: true,
        skipWaiting: false
      },
      pwa
    )
  }

  apply(api) {
    api.chainWebpack(config => {
      config.plugin('constants').tap(([options]) => [
        Object.assign(options, {
          __PWA_ENABLED__: JSON.stringify(this.pwaEnabled),
          __PWA_OPTIONS__: JSON.stringify(this.pwaOptions)
        })
      ])
    })

    api.enhanceAppFiles.add(path.join(__dirname, 'pwa-inject.js'))
    if (this.pwaEnabled && this.pwaOptions.notifyUpdates) {
      api.enhanceAppFiles.add(path.join(__dirname, 'pwa-notifier-inject.js'))
    }

    api.configureDevServer(app => {
      app.use(require('./noop-sw-middleware')())
    })

    api.hooks.add('onGenerated', async () => {
      const { generateSW } = require('workbox-build')
      await generateSW({
        swDest: api.resolvePecoDir('website', 'sw.js'),
        importScripts: [
          api.clientConfig.output.get('publicPath') + 'sw-events.js'
        ],
        globDirectory: api.resolvePecoDir('website'),
        globPatterns: [
          '**/*.{js,css,html,png,jpg,jpeg,gif,svg,woff,woff2,eot,ttf,otf}'
        ]
      })
      await fs.writeFile(
        api.resolvePecoDir('website', 'sw-events.js'),
        `
      self.addEventListener('message', e => {
        const replyPort = e.ports[0]
        const data = e.data
        if (!data || !replyPort) return
        if (replyPort && data.action === 'skipWaiting') {
          e.waitUntil(
            self.skipWaiting().then(
              () => replyPort.postMessage({ error: null }),
              error => replyPort.postMessage({ error })
            )
          )
        }
      })
      `,
        'utf8'
      )
    })
  }
}
