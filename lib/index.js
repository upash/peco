const path = require('upath')
const fs = require('fs-extra')
const { promisify, inspect } = require('util')
const chokidar = require('chokidar')
const chalk = require('chalk')
const QueryBuilder = require('./graphql/query-builder')
const config = require('./utils/config')
const localRequire = require('./utils/local-require')

class EnhanceAppFiles {
  constructor() {
    this.store = new Set()
  }

  add(file) {
    this.store.add(path.normalize(file))
  }

  delete(file) {
    this.store.delete(path.normalize(file))
  }

  has(file) {
    this.store.has(path.normalize(file))
  }

  get files() {
    return [...this.store]
  }
}

class Peco {
  constructor(options) {
    this.options = Object.assign(
      {
        port: 4000
      },
      options
    )
    this.options.baseDir = path.resolve(this.options.baseDir || '.')
    localRequire.setOptions({ baseDir: this.options.baseDir })

    this.hooks = require('./hooks')
    this.queryBuilder = new QueryBuilder()

    // All markdown files
    this.routes = new Map()
    this.config = {}
    this.enhanceAppFiles = new EnhanceAppFiles()
    this.configureDevServerFns = new Set()
    this.chainWebpackFns = new Set()
  }

  use(plugin, options, baseDir) {
    let Plugin
    if (typeof plugin === 'string') {
      Plugin = localRequire.require(plugin, baseDir)
    } else if (typeof plugin === 'function') {
      Plugin = plugin
    }
    const plug = new Plugin(options)
    plug.apply(this)
    return this
  }

  applyPlugins(plugins, baseDir) {
    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        if (Array.isArray(plugin)) {
          this.use(plugin[0], plugin[1], baseDir)
        } else {
          this.use(plugin, null, baseDir)
        }
      }
    } else if (typeof plugins === 'object') {
      for (const name of Object.keys(plugins)) {
        this.use(name, plugins[name], baseDir)
      }
    }

    return this
  }

  configureDevServer(fn) {
    this.configureDevServerFns.add(fn)
    return this
  }

  initWebpackConfig(dev) {
    // Initialize client webpack config
    this.clientConfig = require('./webpack/webpack.client')(this)
    // In production mode we create the server webpack config as well
    if (!dev) {
      this.serverConfig = require('./webpack/webpack.server')(this)
    }

    if (this.options.debugWebpack) {
      console.log(
        inspect(this.clientConfig.toConfig(), {
          depth: null,
          colors: true
        })
      )
    }

    this.chainWebpackFns.forEach(fn => {
      fn(this.clientConfig, { type: 'client' })
      if (this.serverConfig) {
        fn(this.serverConfig, { type: 'server' })
      }
    })
  }

  async prepare({ dev }) {
    console.log('> Building from source')
    // Load user config
    const { data, path: configPath } = await config.load(
      ['config.yml', 'config.toml', 'config.js', 'config.json'],
      path.join(this.options.baseDir, '.peco')
    )
    this.configPath = configPath
    await this.normalizeConfig(data)

    const postcssConfig = await require('postcss-load-config')({
      cwd: this.options.baseDir,
      argv: false
    }).catch(err => {
      if (err.message.includes('No PostCSS Config found')) {
        // Return empty options for PostCSS
        return {}
      }
      throw err
    })

    if (postcssConfig.file) {
      this.postcss = {
        config: {
          path: postcssConfig.file
        }
      }
    } else {
      this.postcss = {
        plugins: [
          require('autoprefixer')({
            browsers: ['ie>9', '>1%']
          })
        ]
      }
    }

    // Set app mode
    // It's useful for webpack
    // We only create a client webpack config in dev mode
    // But create both server and client config in production mode
    this.mode = dev ? 'development' : 'production'

    // Initialize engine
    // Handle actual logic for rendering the app
    const Engine = require(this.config.enginePath)
    this.engine = new Engine(this)

    // Initialize plugins
    this.use(require('../plugins/source-file-system'))
    this.use(
      require('../plugins/google-analytics'),
      this.config.googleAnalytics
    )
    this.use(require('../plugins/pwa'), this.config.pwa)
    if (this.config.plugins) {
      this.applyPlugins(this.config.plugins)
    }
    if (this.config.themeSettings.plugins) {
      this.applyPlugins(
        this.config.themeSettings.plugins,
        this.config.themePath
      )
    }

    if (this.config.chainWebpack) {
      this.chainWebpack(this.config.chainWebpack)
    }

    this.initWebpackConfig(dev)

    // Clean automatically generated directories
    await Promise.all([
      fs.emptyDir(this.resolvePecoDir('data')),
      fs.emptyDir(this.resolvePecoDir('website'))
    ])

    // Build Peco config as JSON file
    // So themes could load it at build time via `import`
    await this.buildSiteData()
    if (dev) {
      // Watch config file and rebuild
      const configWatcher = chokidar.watch(this.configPath, {
        ignoreInitial: true
      })
      configWatcher
        .on('change', filepath => this.buildSiteData(filepath))
        .on('unlink', filepath => this.buildSiteData(filepath))
    }

    await this.hooks.run('onPrepare')
    this.queryBuilder.buildSchema()
  }

  async normalizeConfig(_config) {
    const { configData, siteData } = await require('./utils/normalize-config')(
      _config,
      this.options.baseDir
    )

    this.config = configData
    this.siteData = siteData
  }

  chainWebpack(fn) {
    this.chainWebpackFns.add(fn)
    return this
  }

  // Can be used by plugins to mutate preprocessor options
  configureProprocessor(name, options) {
    this.config[name] = Object.assign({}, this.config[name], options)
    return this
  }

  resolvePecoDir(...args) {
    return this.resolveBaseDir('.peco', ...args)
  }

  resolveDataDir(...args) {
    return this.resolvePecoDir('data', ...args)
  }

  resolveBaseDir(...args) {
    return path.join(this.options.baseDir, ...args)
  }

  resolveSourceDir(...args) {
    return this.resolveBaseDir(this.config.sourceDir, ...args)
  }

  // TODO: Restart when some options like `source` `theme` changed`
  async buildSiteData(filepath) {
    // When the config file is a .js file
    // We need to flush cache
    delete require.cache[this.configPath]

    if (filepath) {
      const { path: configPath, data } = await config.load(
        [this.configPath],
        this.options.baseDir
      )
      this.configPath = configPath
      await this.normalizeConfig(data)
    }

    await fs.ensureDir(this.resolveDataDir())
    await fs.writeFile(
      this.resolveDataDir('__site_data__.json'),
      JSON.stringify(this.siteData),
      'utf8'
    )
  }

  async dev() {
    await this.prepare({ dev: true })

    // Start dev server
    const app = require('express')()

    app.use(
      '/__graphql',
      require('express-graphql')({
        schema: this.queryBuilder.getSchema(),
        graphiql: true,
        context: {
          api: this
        }
      })
    )

    for (const configureDevServer of this.configureDevServerFns) {
      configureDevServer(app)
    }

    const history = require('connect-history-api-fallback')
    app.use(
      history({
        verbose: this.options.debug,
        rewrites: [{ from: /\.html$/, to: '/index.html' }]
      })
    )

    const compiler = require('webpack')(this.clientConfig.toConfig())
    require('webpack-hot-client')(compiler, {
      logLevel: 'error'
    })
    app.use(
      require('webpack-dev-middleware')(compiler, {
        logLevel: 'error',
        publicPath: compiler.options.output.publicPath
      })
    )
    app.listen(this.options.port)
  }

  async build() {
    await this.prepare({ dev: false })

    const compiler = require('webpack')([
      this.serverConfig.toConfig(),
      this.clientConfig.toConfig()
    ])

    const stats = await promisify(compiler.run.bind(compiler))()

    if (stats.hasErrors()) {
      throw new Error(stats.toString('errors-only'))
    }

    const handleRoute = route => {
      if (route.endsWith('.html')) {
        return route
      }
      return route.replace(/\/?$/, '/index.html')
    }

    await this.engine.beforeGenerate()

    // Generate 404 page too
    this.routes.set('/404.html', {})
    await Promise.all(
      [...this.routes.keys()].map(async route => {
        const outFile = path.join(
          this.resolvePecoDir('website'),
          handleRoute(decodeURI(route))
        )
        if (process.stdout.isTTY) {
          console.log(`> Generating for ${decodeURI(route)}`)
        }
        const html = await this.engine.renderToString(route)
        await fs.ensureDir(path.dirname(outFile))
        await fs.writeFile(outFile, html, 'utf8')
      })
    )

    await this.hooks.run('onGenerated')

    console.log(
      chalk.green(
        `> Done, check out ${chalk.cyan(
          path.relative(process.cwd(), this.resolvePecoDir('website'))
        )}`
      )
    )
  }
}

module.exports = function(options) {
  return new Peco(options)
}
