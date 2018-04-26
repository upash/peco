import createApp from './create-app'

const { app, router } = createApp()

// Google analytics integration
/* eslint-disable */
if (process.env.NODE_ENV === 'production' && process.env.GA_ID) {
  (function (i, s, o, g, r, a, m) {
    i.GoogleAnalyticsObject = r
    i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments)
    }
    i[r].l = Number(new Date())
    a = s.createElement(o)
    m = s.getElementsByTagName(o)[0]
    a.async = 1
    a.src = g
    m.parentNode.insertBefore(a, m)
  })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga')

  ga('create', process.env.GA_ID, 'auto')
  ga('send', 'pageview')

  router.afterEach(function (to) {
    ga('set', 'page', to.fullPath)
    ga('send', 'pageview')
  })
}
/* eslint-enable */

router.onReady(() => {
  app.$mount('#__peco')
})
