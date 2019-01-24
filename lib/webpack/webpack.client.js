const fs = require('fs')
const path = require('path')
const base = require('./webpack.base')

module.exports = ctx => {
  const config = base(ctx, 'client')

  const sanitizeDistPath = path.normalize(ctx.resolvePecoDir('dist/client'))
  config.output.path(sanitizeDistPath)

  const staticDir = ctx.resolveBaseDir(ctx.options.staticDir || 'static')
  if (fs.existsSync(staticDir)) {
    config.plugin('copy-static').use(require('copy-webpack-plugin'), [
      [
        {
          from: staticDir,
          to: '.'
        }
      ]
    ])
  }

  return config
}
