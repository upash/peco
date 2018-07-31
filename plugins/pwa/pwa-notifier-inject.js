/* globals __PWA_OPTIONS__, window, document, MessageChannel */
import event from '@app/event'
import notify from 'native-toast'
import 'native-toast/dist/native-toast.css'
import './pwa-notifier.css'

const opts = __PWA_OPTIONS__

const skipWaiting = registration => {
  const worker = registration.waiting
  if (!worker) {
    return Promise.resolve()
  }

  console.log('[peco:pwa] Doing worker.skipWaiting().')
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = event => {
      console.log('[peco:pwa] Done worker.skipWaiting().')
      if (event.data.error) {
        reject(event.data.error)
      } else {
        resolve(event.data)
      }
    }

    worker.postMessage({ action: 'skipWaiting' }, [channel.port2])
  })
}

let notifier

const updateIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`

event.$on('service-worker', ({ type, registration }) => {
  const showNotifier = () => {
    if (!registration.waiting) return

    const button = document.createElement('button')
    button.className = 'pwa-notifier-button'
    button.innerHTML = updateIcon + (opts.updaterButtonText || 'Refresh')
    button.addEventListener('click', () => {
      skipWaiting(registration)
        .then(() => {
          window.location.reload()
        })
        .catch(console.error)
    })

    notifier = notify({
      message:
        opts.updaterMessage ||
        'New contents are available, you can now refresh to apply updates!',
      elements: [button],
      timeout: 0
    })
  }

  if (type === 'registered') {
    showNotifier()
  }

  // Only show notifier when we didn't show notifier on registered
  if (type === 'updated' && !notifier) {
    showNotifier()
    notifier = null
  }
})
