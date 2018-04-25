const handleIndexRoute = route => {
  if (route === '/index') return '/'
  if (route.startsWith('/index/page/')) return route.slice(6)
  return route
}

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
            item.type === 'json'
              ? `const [page, LayoutManager] = await Promise.all([
              import('${item.path}'),
              import('@layout-manager').then(v => v.default)
            ])
            return {
              name: 'page-${path === '/' ? 'index' : path.replace(/\/|\\/g, '-').replace(/\..+$/, '')}',
              render(h) {
                return h(LayoutManager, {
                  props: {
                    page
                  }
                })
              }
            }`
              : ''
          }
        }
      }`
      })
      .join(',')}
  ]
})

export default router

`
