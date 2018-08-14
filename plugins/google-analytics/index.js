const path = require('upath')

class GoogleAnalyticsPlugin {
  constructor(options) {
    this.ga = typeof options === 'string' ? { id: options } : options || {}
  }

  apply(api) {
    api.chainWebpack(config => {
      config.plugin('constants').tap(([options]) => [
        Object.assign(options, {
          __GA_ID__: this.ga.id ? JSON.stringify(this.ga.id) : false
        })
      ])
    })

    api.enhanceAppFiles.add(path.join(__dirname, 'google-analytics-inject.js'))
  }
}

GoogleAnalyticsPlugin.pluginName = 'builtin:google-analytics'

module.exports = GoogleAnalyticsPlugin
