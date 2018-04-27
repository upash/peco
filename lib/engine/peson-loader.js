const qs = require('querystring')
const hotReloadApi = require.resolve('vue-hot-reload-api')

module.exports = function (source) {
  const query = qs.parse(this.resourceQuery.slice(1))

  return `
  var render = function (h) {
    return h('layout-manager', {
      props: {
        page: ${source}
      }
    })
  }
  var component = {
    name: '${query.name}',
    render: render
  }
  if (module.hot) {
    var api = require('${hotReloadApi}')
    var Vue = require('vue')
    api.install(Vue)
    if (!api.compatible) {
      throw new Error('vue-hot-reload-api is not compatible with the version of Vue you are using.')
    }
    module.hot.accept()
    if (module.hot.data) {
      api.rerender('${query.name}', component)
    } else {
      api.createRecord('${query.name}', component)
    }
  }
  export default component
  `
}
