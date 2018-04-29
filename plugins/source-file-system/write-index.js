module.exports = (api, plugin) => {
  api.hooks.add('onBuildIndex', async () => {
    // Write index layout files
    await Promise.all(
      Array.from(plugin.files.entries()).map(async entry => {
        const [filepath, file] = entry
        const { type, pagination } = file.data.attributes
        if (type !== 'index' || pagination === false) return
        if (pagination === undefined && api.config.pagination === false) return

        const pathname = filepath
          .replace(/\.md$/, '')
          .replace(/(^|\/)index$/, '')
        await plugin.generatePagination(pathname, file, plugin.getPosts())
      })
    )
  })
}
