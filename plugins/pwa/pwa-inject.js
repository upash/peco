/* eslint-disable */
import event from '@app/event'

if (process.browser && __PWA_ENABLED__) {
  const { register } = require('register-service-worker')

  register(`${__PUBLIC_PATH__}sw.js`, {
    ready() {
      console.log('[peco:pwa] Service worker is active.')
      event.$emit('service-worker', 'ready')
    },
    cached() {
      console.log('[peco:pwa] Content has been cached for offline use.')
      event.$emit('service-worker', 'cached')
    },
    updated() {
      console.log('[peco:pwa] Content updated.')
      event.$emit('service-worker', 'updated')
    },
    offline() {
      console.log(
        '[peco:pwa] No internet connection found. App is running in offline mode.'
      )
      event.$emit('service-worker', 'offline')
    },
    error(err) {
      console.error('[peco:pwa] Error during service worker registration:', err)
      event.$emit('service-worker', 'error', err)
      if (__GA_ID__) {
        ga('send', 'exception', {
          exDescription: err.message,
          exFatal: false
        })
      }
    }
  })
}
