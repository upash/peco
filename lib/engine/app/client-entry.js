import createApp from 'dot-peco/create-app'

const { app, router } = createApp()

router.onReady(() => {
  app.$mount('#__peco')
})
