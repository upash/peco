const path = require('path')
const chokidar = require('chokidar')
const getPermalink = require('../utils/get-permalink')

const getRoutePath = filepath => {
  return getPermalink(filepath).replace(/\[([^\]]+)\]/g, ':$1')
}

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
      api.routes.set(getRoutePath(filepath), {
        path: `@base/pages/${filepath}`,
        type: 'component'
      })
      await api.hooks.runParallel('onRoutesUpdate')
    }

    const deleteRoute = async filepath => {
      const route = getRoutePath(filepath)
      api.route.delete(route)
      await api.hooks.runParallel('onRoutesUpdate')
    }

    for (const page of pages) {
      addRoute(page)
    }

    if (api.mode !== 'development') return

    const watcher = chokidar.watch(globs, {
      ignoreInitial: true,
      cwd: pagesDir
    })

    watcher.on('add', filepath => {
      addRoute(filepath)
    }).on('unlink', filepath => {
      deleteRoute(filepath)
    })
  })
}
