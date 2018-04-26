const path = require('path')

module.exports = (api, options) => {
  const ga = typeof options === 'string' ? { id: options } : options || {}

  api.chainWebpack(config => {
    config.plugin('constants').tap(([options]) => [
      Object.assign(options, {
        __GA_ID__: ga.id ? JSON.stringify(ga.id) : false
      })
    ])
  })

  api.enhanceAppFiles.add(path.join(__dirname, 'google-analytics-inject.js'))
}
