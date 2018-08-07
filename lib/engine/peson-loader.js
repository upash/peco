const { pathToComponentName } = require('./app/utils')

module.exports = function(source) {
  const json = JSON.parse(source)

  const children = json.compileTemplate === false ? '' : json.body

  return `
  <template>
    <layout-manager :page="$page">${children}</layout-manager>
  </template>

  <peco>
  {
    "name": "wrap-${pathToComponentName(json.permalink)}",
    "page": ${source},
  }
  </peco>

  ${json.hoistedTags ? json.hoistedTags.join('\n') : ''}
  `
}
