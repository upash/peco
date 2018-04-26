const axios = require('axios')

const routes = [
  {
    component: 'components/posts.vue',
    path: '/posts',
    props: async () => {
      const { data } = await axios.get('https://jsonplaceholder.typicode.com/posts', {
        timeout: 3000
      })
      return {
        posts: data
      }
    }
  }
]

module.exports = {
  // Meta data that may be used by themes
  meta: {
    title: 'Peco',
    description: 'Humbly powered by Peco!!!',
  },

  // Configurations that vary for themes
  themeConfig: {},

  permalink: ':year/:month/:day/:slug.html',

  plugins: [
    ['../../lib/plugins/routes', routes]
  ]
}
