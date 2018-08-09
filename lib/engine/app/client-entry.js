import createApp from '#data/create-app'

const { app, router } = createApp()

router.onReady(() => {
  app.$mount('#__peco')
})
