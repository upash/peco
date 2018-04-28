module.exports = (api, plugin) => {
  api.hooks.add('onBuildIndex', async () => {
    // Write index layout files
    await Promise.all(
      Array.from(plugin.files.entries()).map(async entry => {
        const [filepath, file] = entry
        if (file.data.attributes.type === 'index') {
          const pathname = filepath
            .replace(/\.md$/, '')
            .replace(/(^|\/)index$/, '')
          await plugin.generatePagination(pathname, file, plugin.getPosts())
        }
      })
    )
  })
}
