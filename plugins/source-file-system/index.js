const path = require('upath')
const glob = require('fast-glob')
const fs = require('fs-extra')
const chokidar = require('chokidar')
const frontMatter = require('./front-matter')
const localRequire = require('../../lib/utils/local-require')
const {
  hasMatchedLocale,
  matchLocale,
  addIndexSuffix,
  getPageLink,
  stripHTML,
  writeIfChanged
} = require('./utils')

module.exports = class SourceFileSystem {
  apply(api) {
    this.api = api

    require('./write-index')(api, this)
    require('./write-categories')(api, this)
    require('./write-tags')(api, this)
    require('./write-pages')(api, this)

    require('./add-query')(api, this)
    require('./generate-feed')(api, this)

    api.hooks.add('onPrepare', async () => {
      const globs = ['**/*.md', '!**/_!(posts)/*.md']
      const fileStats = await glob(globs, {
        cwd: path.join(api.options.baseDir, api.config.sourceDir),
        stats: true
      })
      const files = new Map([
        [
          'index.md',
          {
            isVirtual: true,
            data: {
              attributes: {
                type: 'index',
                layout: 'index'
              },
              permalink: '/',
              slug: 'index'
            }
          }
        ],
        ...fileStats.map(stats => {
          return [path.normalize(stats.path), { stats }]
        })
      ])

      await this.onInitFiles(files)

      // Watch files in dev mode, and re-`buildData` and/or re-`prepare`
      if (api.mode === 'development') {
        const filesWatcher = chokidar.watch(globs, {
          cwd: path.join(api.options.baseDir, api.config.sourceDir),
          ignoreInitial: true
        })

        filesWatcher
          .on('add', async filepath => {
            await this.onAddFile(path.normalize(filepath)).catch(console.error)
          })
          .on('unlink', async filepath => {
            await this.onDeleteFile(path.normalize(filepath)).catch(
              console.error
            )
          })
          .on('change', async filepath => {
            // Use cached stats since we only need path and birthtime for now
            await this.onChangeFile(path.normalize(filepath)).catch(
              console.error
            )
          })
      }
    })
  }

  addRouteFromPath(filepath, route) {
    if (route) {
      return this.api.routes.set(route, {
        path: filepath,
        type: 'peson'
      })
    }

    const file = this.files.get(filepath)
    this.api.routes.set(file.data.permalink, {
      path: `dot-peco/data/${filepath}.peson`,
      type: 'peson'
    })
  }

  removeRouteByPath(filepath) {
    filepath = `dot-peco/data/${filepath}.peson`
    for (const [_, item] of this.api.routes.entries()) {
      if (item.path === filepath) {
        this.api.routes.delete(_)
        break
      }
    }
  }

  createMarkdownRenderer() {
    const Markdown = require('markdown-it')

    const renderer = new Markdown({
      html: true,
      linkify: true,
      highlight: require('./markdown/highlight')
    })
    renderer.use(require('./markdown/excerpt'))
    renderer.use(require('./markdown/hoist-tags'))
    renderer.use(require('./markdown/extract-title'))

    const { markdown } = this.api.config

    if (markdown.highlightLines !== false) {
      renderer.use(require('markdown-it-highlight-lines'))
    }

    if (markdown.anchor !== false) {
      let slugify
      if (typeof markdown.slugify === 'string') {
        slugify = localRequire.require(markdown.slugify)
      } else if (typeof markdown.slugify === 'function') {
        slugify = markdown.slugify
      } else {
        slugify = require('@sindresorhus/slugify')
      }

      renderer.use(
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
        markdown.plugins(renderer)
      } else if (Array.isArray(markdown.plugins)) {
        for (const plugin of markdown.plugins) {
          renderer.use(localRequire.require(plugin.name), plugin.options)
        }
      }
    }

    return renderer
  }

  async buildFiles({ filepath } = {}) {
    const files = filepath
      ? [[filepath, this.files.get(filepath)]]
      : Array.from(this.files.entries())

    await Promise.all(
      files.map(async ([filepath, file]) => {
        // eslint-disable-next-line no-multi-assign
        const data = file.isVirtual
          ? file.data
          : await this.getFileData(filepath, file.stats)

        this.files.get(filepath).data = data

        const outFile = this.api.resolvePecoDir('data', `${filepath}.peson`)
        await fs.ensureDir(path.dirname(outFile))
        await fs.writeFile(outFile, JSON.stringify(data), 'utf8')
      })
    )
  }

  getPosts() {
    return this.getPages(file => {
      return file.data.attributes.type === 'post'
    }).sort((a, b) => {
      return new Date(a.attributes.date) > new Date(b.attributes.date) ? -1 : 1
    })
  }

  getPages(condition) {
    return (
      [...this.files.values()]
        // Filter by type instead of layout
        // Cause a post's type must be `post` but it can use any `layout` component
        .filter(condition)
        .map(v => v.data)
    )
  }

  async getFileData(filepath, stats) {
    const content = await fs.readFile(
      path.join(this.api.options.baseDir, this.api.config.sourceDir, filepath),
      'utf8'
    )
    const { attributes, body } = frontMatter(content)

    const env = {}

    const markdownRenderer = this.createMarkdownRenderer()
    const html = markdownRenderer.render(body, env)

    const setType = type => {
      if (typeof attributes.type !== 'string') {
        attributes.type = type
      }
    }

    if (filepath === 'index.md') {
      setType('index')
    } else if (filepath.startsWith('_posts/')) {
      setType('post')
    } else {
      setType('page')
    }

    if (attributes.type && !attributes.layout) {
      attributes.layout = attributes.type
    }

    // Ensure page date
    // Default to the creation time of the file
    attributes.date = attributes.date || stats.birthtime

    // Ensure page title
    attributes.title = attributes.title || env.title

    const slug = filepath.replace(/^_posts\//, '').replace(/\.md$/, '')

    const permalink =
      attributes.permalink ||
      this.getPermalink(slug, {
        type: attributes.type,
        date: attributes.date
      })

    const data = {
      slug,
      permalink,
      attributes,
      body: html,
      excerpt: attributes.compileTemplate
        ? stripHTML(env.excerpt)
        : env.excerpt,
      hoistedTags: env.hoistedTags
    }
    return data
  }

  getPermalink(slug, { date, type } = {}) {
    slug = encodeURI(slug)

    if (type === 'post' || type === 'page') {
      const d = new Date(date)
      const year = d.getFullYear()
      const iMonth = d.getMonth() + 1
      const iDay = d.getDate()
      const minutes = d.getMinutes()
      const seconds = d.getSeconds()
      const month = iMonth < 10 ? `0${iMonth}` : iMonth
      const day = iDay < 10 ? `0${iDay}` : iDay

      let langPrefix = ''

      if (this.api.config.localeNames) {
        for (const name of this.api.config.localeNames) {
          const RE = new RegExp(`^${name}[/$]`)
          if (RE.test(slug)) {
            slug = slug.replace(RE, '')
            // Do not add lang prefix for default locale
            // eslint-disable-next-line max-depth
            if (name !== this.api.config.locale) {
              langPrefix = `${name}/`
            }
            break
          }
        }
      }

      let link =
        langPrefix +
        this.api.config.permalink[type]
          .replace(/:year/, year)
          .replace(/:month/, month)
          .replace(/:i_month/, iMonth)
          .replace(/:i_day/, iDay)
          .replace(/:day/, day)
          .replace(/:minutes/, minutes)
          .replace(/:seconds/, seconds)
          .replace(/:slug/, slug)

      return link.replace(/^\/?/, '/')
    }

    const removeIndexSuffix = route => {
      if (route === '/index') {
        return '/'
      }
      if (route.endsWith('/index')) {
        return route.replace(/\/index$/, '')
      }
      return route
    }

    return removeIndexSuffix('/' + slug)
  }

  async onInitFiles(files) {
    this.files = files

    await this.buildFiles()
    for (const filepath of files.keys()) {
      this.addRouteFromPath(filepath)
    }

    await this.api.hooks.runParallel('onBuildIndex')
    await this.api.hooks.runParallel('onRoutesUpdate')
  }

  async onAddFile(filepath) {
    const stats = await fs.stat(this.api.resolveSourceDir(filepath))
    this.files.set(filepath, { stats })
    await this.buildFiles({ filepath })
    this.addRouteFromPath(filepath)
    await this.api.hooks.runParallel('onBuildIndex')
    await this.api.hooks.runParallel('onRoutesUpdate')
  }

  async onChangeFile(filepath) {
    await this.buildFiles({ filepath })
    await this.api.hooks.runParallel('onBuildIndex')
  }

  async onDeleteFile(filepath) {
    this.removeRouteByPath(filepath)
    this.files.delete(filepath)

    await this.api.hooks.runParallel('onBuildIndex')
    await this.api.hooks.runParallel('onRoutesUpdate')
  }

  getPostsByLocale(posts, locale) {
    return posts.filter(post => {
      if (locale === null || locale === this.api.config.locale) {
        return !hasMatchedLocale(this.api.config.localeNames, post.permalink)
      }
      return matchLocale(locale, post.permalink)
    })
  }

  async generatePagination(pathname, file, posts) {
    const { data } = file

    if (this.api.config.localeNames) {
      // get locale of current page
      // default locale is null
      let locale = null
      for (const name of this.api.config.localeNames) {
        if (matchLocale(name, data.permalink)) {
          locale = name
          break
        }
      }

      posts = this.getPostsByLocale(posts, locale)
    }

    if (posts.length === 0) {
      return
    }

    const pagination =
      data.attributes.pagination === undefined
        ? this.api.config.pagination
        : data.attributes.pagination

    let totalPages
    let perPage
    if (pagination === false) {
      totalPages = 1
      perPage = posts.length
    } else {
      totalPages = Math.ceil(posts.length / pagination.perPage)
      perPage = pagination.perPage
    }

    await Promise.all(
      new Array(totalPages).fill(null).map(async (_, index) => {
        const page = index + 1
        const route = getPageLink(pathname, page)

        const outFile = this.api.resolvePecoDir(
          'data',
          `${addIndexSuffix(route)}.peson`
        )
        this.addRouteFromPath(
          outFile.replace(this.api.resolvePecoDir(), 'dot-peco'),
          route
        )

        const start = index * perPage
        await writeIfChanged(
          outFile,
          JSON.stringify(
            Object.assign({}, data, {
              pagination: {
                current: page,
                total: totalPages,
                hasPrev: page < totalPages,
                hasNext: page > 1,
                nextLink: getPageLink(pathname, page - 1),
                prevLink: getPageLink(pathname, page + 1)
              },
              posts: posts.slice(start, start + perPage)
            })
          )
        )
      })
    )
  }
}
