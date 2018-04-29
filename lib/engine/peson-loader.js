const { pathToComponentName } = require('./app/utils')

module.exports = function(source) {
  const json = JSON.parse(source)

  let children = ''
  if (json.attributes.compileTemplate) {
    children = `<div class="markdown-body is-component">${json.body}</div>`
  }

  return `
  <template>
    <layout-manager :page="$options._page">${children}</layout-manager>
  </template>

  <script>
  export default {
    name: '${pathToComponentName(json.permalink)}',
    _page: ${source},
    data() {
      if (!this.$options._page.attributes.compileTemplate) {
        return {}
      }
      return {
        ...this.$options._page.attributes.data,
        page: this.$options._page
      }
    }
  }
  </script>
  ${json.hoistedTags ? json.hoistedTags.join('\n') : ''}
  `
}
