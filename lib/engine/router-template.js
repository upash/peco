// const handleIndexRoute = route => {
//   if (route === '/index') return '/'
//   if (route.startsWith('/index/page/')) return route.slice(6)
//   return route
// }

const { pathToComponentName } = require('./app/utils')

module.exports = ({ routes }) => `
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)


const router = new Router({
  mode: 'history',
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  },
  routes: [
    ${[...routes.entries()]
      .map(([path, item]) => {
        return `{
        path: '${path}',
        component: async () => {
          ${
            item.type === 'peson'
              ? `return import(/* webpackChunkName: "${pathToComponentName(
                  path
                )}" */'${item.path}?name=${pathToComponentName(path)}')`
              : item.type === 'component'
                ? /* handle component */ `

    ${
      item.prefetchFile
        ? `
        const [props, component] = await Promise.all([
          import('${item.prefetchFile}'),
          import('${item.path}')
        ])
        return {
          name: '${pathToComponentName(path)}',
          render(h) {
            return h(component.default, { props })
          }
        }
    `
        : `return import(/* webpackChunkName: "${pathToComponentName(
            path
          )}" */ '${item.path}')`
    }

    `
                : /* otherwise noop */ ''
          }
        }
      }`
      })
      .join(',')}
  ]
})

export default router

`
