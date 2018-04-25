import './global'
import Vue from 'vue'
import router from 'dot-peco/router'

if (process.browser) {
  window.Promise = window.Promise || require('promise-polyfill')
}

const r = require.context('@theme', false, /index\.js$/)
let enhanceApp
r.keys().forEach(fp => {
  if (fp === './index.js') {
    enhanceApp = r(fp).default
  }
})

export default () => {
  const rootOptions = {
    router,
    render(h) {
      return h(
        'div',
        {
          attrs: {
            id: '__peco'
          }
        },
        [
          h(
            'transition',
            {
              attrs: {
                // TODO: allow to configure transition name at route level
                name: 'page',
                mode: 'out-in'
              }
            },
            [
              h('router-view')
            ]
          )
        ]
      )
    }
  }

  if (enhanceApp) {
    enhanceApp({ router, rootOptions })
  }

  const app = new Vue(rootOptions)

  return { app, router }
}
