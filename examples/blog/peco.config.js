const axios = require('axios')

const routes = [
  {
    path: '/posts',
    component: 'components/posts',
    async props() {
      const { data } = await axios.get(
        'https://jsonplaceholder.typicode.com/posts'
      )
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

  locales: {
    'zh-cn': {
      lang: 'zh-CN', // optional html lang attribute
      title: '佩可', // override root title option
      description: '低调低使用佩可驱动' // override root description option
    }
  },

  plugins: [['../../plugins/routes', routes]]
}
