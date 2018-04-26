const path = require('path')

const pathToId = file => {
  return path.basename(file).replace(/[^a-zA-Z0-9_]/g, '_')
}

module.exports = enhanceAppFiles => `
import '@app/global'
import Vue from 'vue'
import router from 'dot-peco/router'
import ClientOnly from '@app/ClientOnly'

Vue.component(ClientOnly.name, ClientOnly)

if (process.browser) {
  window.Promise = window.Promise || require('promise-polyfill')
}

const r = require.context('@theme', false, /index\\.js$/)
let enhanceApp
r.keys().forEach(fp => {
  if (fp === './index.js') {
    enhanceApp = r(fp).default
  }
})

${enhanceAppFiles.map((file, index) => `
import ${pathToId(file)}${index} from '${file}'
`).join('')}

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
        // Removed <transition> support for now
        [
          h('router-view')
        ]
      )
    }
  }

  const ctx = { router, rootOptions }

  if (enhanceApp) {
    enhanceApp(ctx)
  }

  ${enhanceAppFiles.map((file, index) => `
  if (typeof ${pathToId(file)}${index} === 'function') ${pathToId(file)}${index}(ctx)
  `).join('')}

  const app = new Vue(rootOptions)

  return { app, router }
}

`
