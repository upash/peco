const base = require('./webpack.base')

module.exports = ctx => {
  const config = base(ctx, 'client')

  config.output.path(ctx.resolvePecoDir('dist/client'))

  return config
}
