import './global'
import Vue from 'vue'
import router from 'dot-peco/router'

if (process.browser) {
  window.Promise = window.Promise || require('promise-polyfill')
}

export default () => {
  const app = new Vue({
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
  })

  return { app, router }
}
