const path = require('path')
const Config = require('webpack-chain')

module.exports = (ctx, type) => {
  const config = new Config()

  config.merge({
    mode: ctx.mode,
    performance: {
      hints: false
    },
    optimization: {
      minimize: false
    }
  })

  // No need to minimize in server or dev mode
  if (
    type === 'client' &&
    ctx.mode === 'production' &&
    ctx.options.minimize !== false
  ) {
    config.merge({
      optimization: {
        minimize: true,
        minimizer: [
          {
            apply(compiler) {
              const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
              new UglifyJsPlugin({
                cache: true,
                parallel: true,
                uglifyOptions: {
                  output: {
                    comments: false,
                    beautify: false
                  },
                  ie8: false
                }
              }).apply(compiler)
            }
          }
        ]
      }
    })
  }

  config.output
    .filename(
      ctx.mode === 'production' ?
        '_peco/assets/js/[chunkhash:6].js' :
        '_peco/assets/js/[name].js'
    )
    .publicPath('/')

  config.resolve.extensions.add('.js').add('.json')

  const addModules = target => {
    target.add(path.join(__dirname, '../../node_modules')).add('node_modules')
  }

  addModules(config.resolve.modules)
  addModules(config.resolveLoader.modules)

  config.resolve.alias
    .set('@theme', ctx.config.themePath)
    .set('dot-peco', ctx.resolvePecoDir())
    .set('vue$', 'vue/dist/vue.esm.js')
    .set('@base', ctx.options.baseDir)

  config.module
    .rule('js')
    .test(/\.js$/)
    .include.add(filepath => {
      if (
        filepath.startsWith(ctx.config.theme) ||
        filepath.startsWith(ctx.resolvePecoDir())
      ) {
        return true
      }
      return !/node_modules/.test(filepath)
    })
    .end()
    .use('babel-loader')
    .loader('babel-loader')
    .options({
      babelrc: false,
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            loose: true,
            exclude: ['transform-regenerator', 'transform-async-to-generator']
          }
        ]
      ],
      plugins: [
        require.resolve('@babel/plugin-syntax-dynamic-import'),
        [
          require.resolve('fast-async'),
          {
            spec: true
          }
        ]
      ]
    })

  const inlineLimit = 10000

  config.module
    .rule('images')
    .test(/\.(png|jpe?g|gif)(\?.*)?$/)
    .use('url-loader')
    .loader('url-loader')
    .options({
      limit: inlineLimit,
      name: `_peco/assets/img/[name].[hash:8].[ext]`
    })

  // do not base64-inline SVGs.
  // https://github.com/facebookincubator/create-react-app/pull/1180
  config.module
    .rule('svg')
    .test(/\.(svg)(\?.*)?$/)
    .use('file-loader')
    .loader('file-loader')
    .options({
      name: `_peco/assets/img/[name].[hash:8].[ext]`
    })

  config.module
    .rule('media')
    .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
    .use('url-loader')
    .loader('url-loader')
    .options({
      limit: inlineLimit,
      name: `_peco/assets/media/[name].[hash:8].[ext]`
    })

  config.module
    .rule('fonts')
    .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
    .use('url-loader')
    .loader('url-loader')
    .options({
      limit: inlineLimit,
      name: `_peco/assets/fonts/[name].[hash:8].[ext]`
    })

  const isServer = type === 'server'
  const isProd = ctx.mode === 'production'

  if (!isServer && isProd) {
    config.plugin('css-extract').use(require('mini-css-extract-plugin'), [
      {
        filename: '_peco/assets/css/styles.[chunkhash:6].css'
      }
    ])
  }

  function createCSSRule(lang, test, loader, options) {
    const baseRule = config.module.rule(lang).test(test)
    const modulesRule = baseRule.oneOf('modules').resourceQuery(/module/)
    const normalRule = baseRule.oneOf('normal')

    applyLoaders(modulesRule, true)
    applyLoaders(normalRule, false)

    function applyLoaders(rule, modules) {
      const sourceMap = !isProd

      if (!isServer) {
        if (isProd) {
          rule
            .use('extract-css-loader')
            .loader(require('mini-css-extract-plugin').loader)
        } else {
          rule.use('vue-style-loader').loader('vue-style-loader')
        }
      }

      rule
        .use('css-loader')
        .loader(isServer ? 'css-loader/locals' : 'css-loader')
        .options({
          modules,
          sourceMap,
          localIdentName: `[local]_[hash:base64:8]`,
          importLoaders: 1,
          minimize: isProd
        })

      rule
        .use('postcss-loader')
        .loader('postcss-loader')
        .options(
          Object.assign(
            {
              plugins: [require('autoprefixer')],
              sourceMap: !isProd
            },
            ctx.postcss
          )
        )

      if (loader) {
        rule
          .use(loader)
          .loader(loader)
          .options(
            Object.assign(
              {
                sourceMap
              },
              options
            )
          )
      }
    }
  }

  createCSSRule('css', /\.css$/)
  createCSSRule('scss', /\.scss$/, 'sass-loader')
  createCSSRule('sass', /\.sass$/, 'sass-loader', { indentedSyntax: true })
  createCSSRule('less', /\.less$/, 'less-loader')
  createCSSRule('stylus', /\.styl(us)?$/, 'stylus-loader', {
    preferPathResolver: 'webpack'
  })

  if (ctx.mode === 'development') {
    config.plugin('timefix').use(require('time-fix-plugin'))
  }

  if (ctx.options.progress !== false) {
    config.plugin('progress-bar').use(require('webpackbar'), [
      {
        name: type,
        color: type === 'client' ? 'cyanBright' : 'magentaBright',
        profile: ctx.options.profile
      }
    ])
  }

  config.plugin('reporter').use(
    class ReporterPlugin {
      apply(compiler) {
        compiler.hooks.done.tap('peco-reporter', stats => {
          if (stats.hasErrors() || stats.hasWarnings()) {
            return console.log(
              stats.toString({
                colors: true,
                version: false,
                buildAt: false,
                chunks: false,
                modules: false,
                children: false
              })
            )
          }
          if (ctx.mode === 'development') {
            console.log(`> Open http://localhost:${ctx.options.port}`)
          }
        })
      }
    }
  )

  config.plugin('constants').use(require('webpack').DefinePlugin, [
    {
      'process.env.NODE_ENV': JSON.stringify(ctx.mode),
      'process.browser': JSON.stringify(type === 'client'),
      'process.server': JSON.stringify(type === 'server')
    }
  ])

  return config
}
