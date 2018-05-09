/* globals __FEED_ENABLED__, __FEED_PATH__ */
import Vue from 'vue'

Vue.mixin({
  computed: {
    $feedLink: function() {
      if (!__FEED_ENABLED__) return null
      return {
        rel: 'alternate',
        href: '/' + __FEED_PATH__,
        type: 'application/rss+xml',
        title: this.$siteData.title
      }
    }
  }
})
