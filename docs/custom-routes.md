# Custom routes

Peco has a plugin that allows you to to define routes for any data source, this works a bit like [react-static](https://github.com/nozzle/react-static):

You need to use **peco.config.js** for this:

```js
const axios = require('axios')

const routes = async () => {
  return [
    {
      path: '/posts',
      component: 'components/posts',
      async props() {
        const { data: posts } = await axios.get(
          'https://jsonplaceholder.typicode.com/posts'
        )
        return {
          posts
        }
      }
    }
  ]
}

module.exports = {
  plugins: [['peco/plugins/routes', routes]]
}
```

Then you can populate a `component/posts.vue` in base directory, it accepts the `props` you defined in routes, in this case it's `posts`.
