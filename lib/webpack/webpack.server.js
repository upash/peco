const nodeExternals = require('webpack-node-externals')
const base = require('./webpack.base')

module.exports = ctx => {
  const config = base(ctx, 'server')

  config.devtool('source-map')
  config.target('node')

  config.output
    .path(ctx.resolvePecoDir('dist/server'))
    .libraryTarget('commonjs2')

  config.externals([
    nodeExternals({
      // do not externalize dependencies that need to be processed by webpack.
      // you can add more file types here e.g. raw *.vue files
      // you should also whitelist deps that modifies `global` (e.g. polyfills)
      whitelist: /\.css$/
    })
  ])

  return config
}
