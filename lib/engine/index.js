const path = require('path')
const fs = require('fs-extra')
const routerTemplate = require('./router-template')
const createAppTemplate = require('./create-app-template')

module.exports = class VueEngine {
  constructor(api) {
    this.name = 'vue'
    this.api = api

    api.hooks.add('onRoutesUpdate', () => this.onRoutesUpdate())
    api.hooks.add('onPrepare', () => this.onPrepare())

    api.chainWebpack((config, { type }) => {
      config.entry('main').add(path.join(__dirname, `app/${type}-entry.js`))

      // prettier-ignore
      config.module
        .rule('vue')
        .test(/\.vue$/)
        .use('vue-loader')
        .loader('vue-loader')

      // prettier-ignore
      config.module
        .rule('peson')
        .test(/\.peson$/)
          .use('vue-loader')
          . loader('vue-loader')
            .end()
          .use('peson-loader')
            .loader(require.resolve('./peson-loader'))

      const { VueLoaderPlugin } = require('vue-loader')
      // prettier-ignore
      config.plugin('vue-loader')
        .use(VueLoaderPlugin)

      // prettier-ignore
      config.module.rule('js')
        .include
        .add(path.join(__dirname, 'app'))

      // prettier-ignore
      config.resolve
        .extensions
        .add('.vue')
        .end()
        .alias
        .set('@app', path.join(__dirname, 'app'))
      // .set('@site-data', path.join(__dirname, 'app/site-data'))

      if (type === 'client') {
        // Generate index.html for client build
        // prettier-ignore
        config.plugin('html')
          .use(require('html-webpack-plugin'), [
            {
              template: path.join(__dirname, 'app/index.dev.html')
            }
          ])

        if (api.mode === 'production') {
          config
            .plugin('vue-ssr')
            .use(require('vue-server-renderer/client-plugin'))
        }
      } else if (type === 'server') {
        config
          .plugin('vue-ssr')
          .use(require('vue-server-renderer/server-plugin'))
      }
    })
  }

  async onPrepare() {
    const createAppData = createAppTemplate([...this.api.enhanceAppFiles])
    await fs.writeFile(
      this.api.resolvePecoDir('create-app.js'),
      createAppData,
      'utf8'
    )
  }

  async onRoutesUpdate() {
    await this.buildRouter()
  }

  async buildRouter() {
    const routerData = routerTemplate({ routes: this.api.routes })
    await fs.writeFile(this.api.resolvePecoDir('router.js'), routerData, 'utf8')
  }

  async beforeGenerate() {
    const fs = require('fs-extra')
    const { createBundleRenderer } = require('vue-server-renderer')

    const template = await fs.readFile(
      path.join(__dirname, './app/index.prod.html'),
      'utf-8'
    )
    const serverBundle = require(this.api.resolvePecoDir(
      'dist/server/vue-ssr-server-bundle.json'
    ))
    const clientManifest = require(this.api.resolvePecoDir(
      'dist/client/vue-ssr-client-manifest'
    ))

    this.renderer = createBundleRenderer(serverBundle, {
      template,
      clientManifest,
      inject: false,
      basedir: this.api.options.baseDir,
      // TODO: optimize this
      runInNewContext: true
    })

    // Copy assets
    await fs.copy(
      this.api.resolvePecoDir('dist/client'),
      this.api.resolvePecoDir('website')
    )
  }

  renderToString(route) {
    const context = { url: route }
    return this.renderer.renderToString(context)
  }
}
