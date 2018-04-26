const axios = require('axios')

const routes = [
  {
    component: 'components/posts.vue',
    path: '/posts',
    props: async () => {
      const { data } = await axios.get('https://jsonplaceholder.typicode.com/posts')
      return {
        posts: data
      }
    }
  }
]

module.exports = {
  title: 'Peco',
  description: 'Humbly powered by Peco!!!',
  permalink: ':year/:month/:day/:slug.html',

  plugins: [
    ['../../lib/plugins/routes', routes]
  ]
}
