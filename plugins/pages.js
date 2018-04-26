const path = require('path')
const chokidar = require('chokidar')

module.exports = api => {
  api.hooks.add('onInitFiles', async () => {
    const globs = ['**/*.{vue,js}', '!**/node_modules/*', '!**/_*']
    const pagesDir = path.join(api.options.baseDir, 'pages')
    const pages = await require('fast-glob')(globs, {
      cwd: pagesDir
    })

    if (pages.length > 0) {
      console.log('> Building from pages')
    }

    const addRoute = async filepath => {
      api.routes.set(api.getPermalink(filepath), {
        path: `@base/pages/${filepath}`,
        type: 'component'
      })
    }

    const deleteRoute = async filepath => {
      const route = api.getPermalink(filepath)
      api.route.delete(route)
      await api.hooks.runParallel('onRoutesUpdate')
    }

    for (const page of pages) {
      addRoute(page)
    }
    await api.hooks.runParallel('onRoutesUpdate')

    if (api.mode !== 'development') return

    const watcher = chokidar.watch(globs, {
      ignoreInitial: true,
      cwd: pagesDir
    })

    watcher.on('add', async filepath => {
      addRoute(filepath)
      await api.hooks.runParallel('onRoutesUpdate')
    }).on('unlink', filepath => {
      deleteRoute(filepath)
    })
  })
}
