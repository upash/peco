/* eslint-disable */
import event from '@app/event'

if (
  process.browser &&
  process.env.NODE_ENV === 'production' &&
  __PWA_ENABLED__ &&
  window.location.protocol === 'https:'
) {
  const { register } = require('register-service-worker')

  register(`${__PUBLIC_PATH__}sw.js`, {
    ready() {
      console.log('[peco:pwa] Service worker is active.')
      event.$emit('service-worker', { type: 'ready' })
    },
    registered(registration) {
      event.$emit('service-worker', { type: 'registered', registration })
    },
    cached(registration) {
      console.log('[peco:pwa] Content has been cached for offline use.')
      event.$emit('service-worker', { type: 'cached', registration })
    },
    updated(registration) {
      console.log('[peco:pwa] Content updated.')
      event.$emit('service-worker', { type: 'updated', registration })
    },
    offline() {
      console.log(
        '[peco:pwa] No internet connection found. App is running in offline mode.'
      )
      event.$emit('service-worker', 'offline')
    },
    error(error) {
      console.error('[peco:pwa] Error during service worker registration:', error)
      event.$emit('service-worker', { type: 'error', error })
      if (__GA_ID__) {
        ga('send', 'exception', {
          exDescription: error.message,
          exFatal: false
        })
      }
    }
  })
}
