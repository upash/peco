import Vue from 'vue'
import siteData from 'dot-peco/data/__site_data'

const store = new Vue({
  data: { siteData }
})

if (module.hot) {
  module.hot.accept('dot-peco/data/__site_data', () => {
    store.siteData = require('dot-peco/data/__site_data').default
  })
}

export default {
  computed: {
    $currentLocale() {
      const locale = this.$route.path.split('/')[1]
      if (locale && store.siteData.locales && Object.keys(store.siteData.locales).indexOf(locale) > -1) {
        return locale
      }
      return store.siteData.defaultLocale
    },

    $siteData() {
      if (!store.siteData.locales) return store.siteData

      return {
        ...store.siteData,
        ...store.siteData.locales[this.$currentLocale]
      }
    },

    $themeConfig() {
      if (!this.$siteData.themeConfig) return {}
      if (!this.$siteData.themeConfig.locales) return this.$siteData.themeConfig
      return {
        ...this.$siteData.themeConfig,
        ...this.$siteData.themeConfig.locales[this.$currentLocale]
      }
    }
  }
}
