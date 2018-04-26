const fs = require('fs-extra')

module.exports = (api, routes) => {
  if (!routes) return

  api.hooks.add('onInitFiles', async () => {
    console.log('> Fetching data for routes')
    if (typeof routes === 'function') {
      routes = await routes()
    }
    await Promise.all(routes.map(async (route, index) => {
      const data = route.props ? await route.props() : null
      const outFile = api.resolvePecoDir('data', `__routes_prefetch_${index}.json`)
      await fs.writeFile(outFile, JSON.stringify(data), 'utf8')
      api.routes.set(route.path, {
        type: 'component',
        path: `@base/${route.component}`,
        prefetchFile: outFile
      })
    }))
  })
}
