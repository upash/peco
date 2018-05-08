const fs = require('fs-extra')

module.exports = (api, plugin) => {
  api.hooks.add('onBuildIndex', async () => {
    const pages = plugin
      .getPages(file => file.data.attributes.type === 'page')
      .map(data => ({
        title: data.attributes.title,
        permalink: data.permalink
      }))
    await fs.writeFile(
      api.resolvePecoDir('data/__pages__.json'),
      JSON.stringify(pages),
      'utf8'
    )
  })
}
