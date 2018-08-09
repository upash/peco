const path = require('upath')
const fs = require('fs-extra')

module.exports = class RoutesPlugin {
  constructor(routes) {
    this.routes = routes
  }

  apply(api) {
    if (!this.routes) return

    api.hooks.add('onPrepare', async () => {
      console.log('> Fetching routes')
      let routes = this.routes
      if (typeof routes === 'function') {
        routes = await routes()
      }
      await Promise.all(
        routes.map(async (route, index) => {
          let props
          let prefetchFile
          if (route.props) {
            props = await route.props()
          }
          if (props) {
            const outFile = api.resolvePecoDir(
              'data',
              `__prefetch/route_${index}.json`
            )
            await fs.ensureDir(path.dirname(outFile))
            await fs.writeFile(outFile, JSON.stringify(props), 'utf8')
            prefetchFile = outFile.replace(api.resolvePecoDir(), 'dot-peco')
          }
          api.routes.set(route.path, {
            type: 'component',
            path: `#base/${route.component}`,
            prefetchFile
          })
        })
      )

      await api.hooks.runParallel('onRoutesUpdate')
    })
  }
}
