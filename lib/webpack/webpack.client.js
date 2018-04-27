const fs = require('fs')
const base = require('./webpack.base')

module.exports = ctx => {
  const config = base(ctx, 'client')

  config.output.path(ctx.resolvePecoDir('dist/client'))

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
