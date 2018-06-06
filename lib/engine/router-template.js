// const handleIndexRoute = route => {
//   if (route === '/index') return '/'
//   if (route.startsWith('/index/page/')) return route.slice(6)
//   return route
// }

const { pathToComponentName } = require('./app/utils')

const notFoundRoute = `
  {
    path: '*',
    component: {
      name: 'page--404',
      render(h) {
        return h('layout-manager', {
          props: {
            page: {
              attributes: {
                layout: '404'
              }
            }
          }
        })
      }
    }
  }
`

module.exports = ({ routes }) => `
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)


const router = new Router({
  mode: 'history',
  base: __PUBLIC_PATH__,
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
                )}" */'${item.path}')`
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
      .join(',')},
      ${notFoundRoute}
  ]
})

export default router

`
