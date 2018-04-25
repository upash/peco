import './global'
import Vue from 'vue'
import router from 'dot-peco/router'

export default () => {
  const app = new Vue({
    router,
    render: h =>
      h(
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
                name: 'slide'
              }
            },
            [h('router-view')]
          )
        ]
      )
  })

  return { app, router }
}
