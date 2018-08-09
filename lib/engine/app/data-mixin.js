import Vue from 'vue'
import siteData from '#data/__site_data__'

const store = new Vue({
  data: { siteData }
})

if (module.hot) {
  module.hot.accept('#data/__site_data__', () => {
    store.siteData = require('#data/__site_data__')
  })
}

export default {
  computed: {
    $currentLocale() {
      const locale = this.$route.path.split('/')[1]
      if (
        locale &&
        store.siteData.locales &&
        Object.keys(store.siteData.locales).indexOf(locale) > -1
      ) {
        return locale
      }
      return store.siteData.locale
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
  },

  methods: {
    $getCategoryLink(name) {
      return `${
        this.$currentLocale === this.$siteData.locale
          ? ''
          : `/${this.$currentLocale}`
      }/categoryes/${name}`
    },

    $getTagLink(name) {
      return `${
        this.$currentLocale === this.$siteData.locale
          ? ''
          : `/${this.$currentLocale}`
      }/tags/${name}`
    }
  }
}
