const path = require('path')
const fs = require('fs-extra')
const { promisify, inspect } = require('util')
const chokidar = require('chokidar')
const chalk = require('chalk')
const config = require('./utils/config')
const frontMatter = require('./utils/front-matter')
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
    this.files = new Map()
    this.routes = new Map()
    this.config = {}
    this.enhanceAppFiles = new Set()
  }

  use(plugin, options) {
    if (typeof plugin === 'string') {
      localRequire.require(plugin)(this, options)
    } else {
      plugin(this, options)
    }
    return this
  }

  getPermalink(filepath, { date, type } = {}) {
    const slug = encodeURI(
      filepath.replace(/^_posts\//, '').replace(/\.md$/, '')
    )

    if (type === 'post') {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = d.getMonth()
      const day = d.getDate()
      const minutes = d.getMinutes()
      const seconds = d.getSeconds()

      return this.config.permalink
        .replace(/:year/, year)
        .replace(/:month/, month)
        .replace(/:day/, day)
        .replace(/:minutes/, minutes)
        .replace(/:seconds/, seconds)
        .replace(/:slug/, slug)
        .replace(/^\/?/, '/')
    }

    return require('./utils/handle-index-route')('/' + slug)
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
      ['peco.config.yml', 'peco.config.js'],
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
    this.hooks.addFrom('onRoutesUpdate', this.engine)
    this.hooks.addFrom('onPrepare', this.engine)

    // Initialize plugins
    // Plugin to write index file
    this.use(require('./plugins/write-index'))
    this.use(require('./plugins/google-analytics'), this.config.googleAnalytics)
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

    // Matches all markdown files
    // But excluding folders starting with and underscore
    // Excepte for `_posts`
    const globs = ['**/*.md', '!**/_!(posts)/*.md']
    const fileStats = await require('fast-glob')(globs, {
      cwd: path.join(this.options.baseDir, this.config.sourceDir),
      stats: true
    })

    await this.onInitFiles(
      new Map(
        fileStats.map(stats => {
          return [stats.path, { stats }]
        })
      )
    )

    await this.hooks.runParallel('onPrepare')

    // Watch files in dev mode, and re-`buildData` and/or re-`prepare`
    if (dev) {
      const filesWatcher = chokidar.watch(globs, {
        cwd: path.join(this.options.baseDir, this.config.sourceDir),
        ignoreInitial: true
      })

      filesWatcher
        .on('add', async filepath => {
          await this.onAddFile(filepath)
        })
        .on('unlink', async filepath => {
          await this.onDeleteFile(filepath)
        })
        .on('change', async filepath => {
          // Use cached stats since we only need path and birthtime for now
          await this.onAddFile(filepath, { type: 'change' })
        })
    }

    // Build Peco config as JSON file
    // So themes could load it at build time via `import`
    await this.buildSiteMeta()
    if (dev) {
      // Watch config file and rebuild
      const configWatcher = chokidar.watch(this.configPath, {
        ignoreInitial: true
      })
      configWatcher
        .on('change', filepath => this.buildSiteMeta(filepath))
        .on('unlink', filepath => this.buildSiteMeta(filepath))
    }
  }

  // TODO: really should clean up this mess
  async normalizeConfig(_config) {
    const { configData, siteMeta } = await require('./utils/normalize-config')(
      _config,
      this.options.baseDir
    )

    this.config = configData
    this.siteMeta = siteMeta

    const Markdown = require('markdown-it')
    this.markdown = new Markdown({
      html: true,
      linkify: true,
      highlight: require('./markdown/highlight')
    })
    this.markdown.use(require('./markdown/excerpt'))

    const { markdown } = configData

    if (markdown.highlightLines !== false) {
      this.markdown.use(require('markdown-it-highlight-lines'))
    }

    if (markdown.anchor !== false) {
      let slugify
      if (typeof markdown.slugify === 'string') {
        slugify = localRequire.require(markdown.slugify)
      } else if (typeof markdown.slugify === 'function') {
        slugify = markdown.slugify
      }
      this.markdown.use(
        require('markdown-it-anchor'),
        Object.assign(
          {
            slugify
          },
          markdown.anchor
        )
      )
    }

    if (markdown.plugins) {
      if (typeof markdown.plugins === 'function') {
        markdown.plugins(this.markdown)
      } else if (Array.isArray(markdown.plugins)) {
        for (const plugin of markdown.plugins) {
          this.markdown.use(localRequire.require(plugin.name), plugin.options)
        }
      }
    }
  }

  chainWebpack(fn) {
    fn(this.clientConfig, { type: 'client' })
    if (this.serverConfig) {
      fn(this.serverConfig, { type: 'server' })
    }

    return this
  }

  resolvePecoDir(...args) {
    return path.posix.join(this.options.baseDir, '.peco', ...args)
  }

  async getFileData(filepath, stats) {
    const content = await fs.readFile(
      path.join(this.options.baseDir, this.config.sourceDir, filepath),
      'utf8'
    )
    const { attributes, body } = frontMatter(content)

    const env = {}

    // Ensure page layout and type
    const setLayout = layout => {
      if (typeof attributes.layout !== 'string') {
        attributes.layout = layout
      }
    }
    const setType = type => {
      if (typeof attributes.type !== 'string') {
        attributes.type = type
      }
    }

    if (filepath === 'index.md') {
      setLayout('index')
      setType('index')
    } else if (filepath.startsWith('_posts/')) {
      setLayout('post')
      setType('post')
    } else {
      setLayout('page')
      setType('page')
    }

    // Ensure page date
    // Default to the creation time of the file
    attributes.date = attributes.date || stats.birthtime

    const permalink = this.getPermalink(filepath, {
      type: attributes.layout,
      date: attributes.date
    })
    const data = {
      slug: permalink.slice(1),
      permalink,
      attributes,
      body: this.markdown.render(body, env),
      excerpt: env.excerpt
    }
    return data
  }

  addRouteFromPath(filepath, route) {
    if (route) {
      return this.routes.set(route, {
        path: filepath,
        type: 'json'
      })
    }

    const file = this.files.get(filepath)
    if (file.data.attributes.type !== 'index') {
      this.routes.set(file.data.permalink, {
        path: `dot-peco/data${file.data.permalink}.json`,
        type: 'json'
      })
    }
  }

  removeRouteByPath(filepath) {
    for (const [_, item] of this.routes.entries()) {
      if (item.path === filepath) {
        this.routes.delete(_)
        break
      }
    }
  }

  async onDeleteFile(filepath) {
    this.files.delete(filepath)
    this.removeRouteByPath(filepath)
    await this.buildFiles()
    await this.hooks.runParallel('onRoutesUpdate')
  }

  async onAddFile(filepath) {
    const stats = await fs.stat(
      path.join(this.options.baseDir, this.config.sourceDir, filepath)
    )

    this.files.set(filepath, {
      stats,
      data: await this.getFileData(filepath, stats)
    })
    this.addRouteFromPath(filepath)
    await this.buildFiles({ filepath })
    await this.hooks.runParallel('onRoutesUpdate')
  }

  async onInitFiles(files) {
    this.files = files
    await this.buildFiles()
    for (const filepath of files.keys()) {
      this.addRouteFromPath(filepath)
    }
    await this.hooks.runParallel('onInitFiles')
    // The files data is ready so tell the engine about that
    // e.g. vue-engine will create a router.js
    await this.hooks.runParallel('onRoutesUpdate')
  }

  async buildFiles({ filepath } = {}) {
    const files = filepath ?
      [[filepath, this.files.get(filepath)]] :
      Array.from(this.files.entries())

    await Promise.all(
      files.map(async ([filepath, file]) => {
        // eslint-disable-next-line no-multi-assign
        const data = (this.files.get(filepath).data = await this.getFileData(
          filepath,
          file.stats
        ))

        // Write data for index type later
        if (data.attributes.type === 'index') {
          return
        }

        const outFile = this.resolvePecoDir('data', `${data.permalink}.json`)
        await fs.ensureDir(path.dirname(outFile))
        await fs.writeFile(outFile, JSON.stringify(data), 'utf8')
      })
    )
    // Sort posts
    const posts = [...this.files.values()]
      .filter(file => file.data.attributes.layout === 'post')
      .map(v => v.data)
      .sort((a, b) => {
        return new Date(a.attributes.date) > new Date(b.attributes.date) ?
          -1 :
          1
      })

    await this.hooks.runParallel('buildFiles', posts)
  }

  // TODO: Restart when some options like `source` `theme` changed`
  async buildSiteMeta(filepath) {
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
      this.resolvePecoDir('data/__siteMeta.json'),
      JSON.stringify(this.siteMeta),
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
