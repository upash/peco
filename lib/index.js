const path = require('path')
const fs = require('fs-extra')
const { promisify, inspect } = require('util')
const chokidar = require('chokidar')
const chalk = require('chalk')
const config = require('./utils/config')
const localRequire = require('./utils/local-require')

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

    // All markdown files
    this.routes = new Map()
    this.config = {}
    this.enhanceAppFiles = new Set()
  }

  use(plugin, options) {
    let Plugin
    if (typeof plugin === 'string') {
      Plugin = localRequire.require(plugin)
    } else if (typeof plugin === 'function') {
      Plugin = plugin
    }
    const plug = new Plugin(options)
    plug.apply(this)
    return this
  }

  applyPlugins() {
    const { plugins } = this.config
    if (!plugins) return

    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        if (Array.isArray(plugin)) {
          this.use(plugin[0], plugin[1])
        } else {
          this.use(plugin)
        }
      }
    } else if (typeof plugins === 'object') {
      for (const name of Object.keys(plugins)) {
        this.use(name, plugins[name])
      }
    }

    return this
  }

  async prepare({ dev }) {
    console.log('> Building from source')
    // Load user config
    const { data, path: configPath } = await config.load(
      ['peco.config.yml', 'peco.config.toml', 'peco.config.js'],
      this.options.baseDir
    )
    this.configPath = configPath
    await this.normalizeConfig(data)

    const postcssConfig = await require('postcss-load-config')({
      cwd: process.cwd(),
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
        plugins: [require('autoprefixer')()]
      }
    }

    // Set app mode
    // It's useful for webpack
    // We only create a client webpack config in dev mode
    // But create both server and client config in production mode
    this.mode = dev ? 'development' : 'production'

    // Initialize client webpack config
    this.clientConfig = require('./webpack/webpack.client')(this)
    // In production mode we create the server webpack config as well
    if (!dev) {
      this.serverConfig = require('./webpack/webpack.server')(this)
    }

    // Initialize engine
    // Handle actual logic for rendering the app
    const Engine = require(this.config.enginePath)
    this.engine = new Engine(this)

    // Initialize plugins
    this.use(require('../plugins/source-file-system'))
    this.use(require('../plugins/google-analytics'), this.config.googleAnalytics)
    this.applyPlugins()

    if (this.options.debugWebpack) {
      console.log(
        inspect(this.clientConfig.toConfig(), {
          depth: null,
          colors: true
        })
      )
    }

    // Clean .peco directory
    await fs.emptyDir(this.resolvePecoDir())

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

    await this.hooks.runParallel('onPrepare')
  }

  // TODO: really should clean up this mess
  async normalizeConfig(_config) {
    const { configData, siteData } = await require('./utils/normalize-config')(
      _config,
      this.options.baseDir
    )

    this.config = configData
    this.siteData = siteData
  }

  chainWebpack(fn) {
    fn(this.clientConfig, { type: 'client' })
    if (this.serverConfig) {
      fn(this.serverConfig, { type: 'server' })
    }

    return this
  }

  resolvePecoDir(...args) {
    return this.resolveBaseDir('.peco', ...args)
  }

  resolveBaseDir(...args) {
    return path.posix.join(this.options.baseDir, ...args)
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
      const { path: configPath, data } = await config.load([this.configPath], this.options.baseDir)
      this.configPath = configPath
      await this.normalizeConfig(data)
    }

    await fs.ensureDir(this.resolvePecoDir('data'))
    await fs.writeFile(
      this.resolvePecoDir('data/__site_data.json'),
      JSON.stringify(this.siteData),
      'utf8'
    )
  }

  async dev() {
    await this.prepare({ dev: true })

    // Start dev server
    const app = require('express')()
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

    console.log(
      chalk.green(
        `> Done, check out ${chalk.cyan(
          path.relative(process.cwd(), this.resolvePecoDir('website'))
        )}`
      )
    )
  }
}

module.exports = function (options) {
  return new Peco(options)
}
