const { getOptions } = require('loader-utils')
const qs = require('querystring')
const fs = require('fs-extra')

module.exports = async function() {
  const query = qs.parse(this.resourceQuery.slice(1))
  const { api } = getOptions(this)
  const callback = this.async()

  if (query.type === 'queryPageByPath') {
    const route = api.routes.get(query.value)
    if (!route) {
      return callback(new Error(`Cannot find page for ${query.value}`))
    }
    try {
      const path = route.path.replace('dot-peco', api.resolvePecoDir())
      const content = await fs.readFile(path, 'utf8')
      callback(null, `export default ${content}`)
    } catch (err) {
      callback(err)
    }
  } else {
    callback(new Error(`Unknown query type: ${query.type}`))
  }
}
