module.exports = ({ attribute, nameMapping, type, layout, injectName }) => (
  api,
  plugin
) => {
  // Allow to disable this
  if (api.config[type] === false) {
    return
  }
  api.hooks.add('onBuildIndex', async () => {
    // Group posts by categories
    const allPosts = new Map()
    for (const post of plugin.getPosts()) {
      if (post.attributes[attribute]) {
        const names = [].concat(post.attributes[attribute])
        for (const name of names) {
          if (!allPosts.has(name)) {
            allPosts.set(name, new Set())
          }
          allPosts.get(name).add(post)
        }
      }
    }

    if (allPosts.size === 0) return

    const { localeNames, defaultLocale } = api.config
    const mapping = api.config[nameMapping] || {}

    await Promise.all(
      [...allPosts.entries()].map(async ([name, posts]) => {
        const locales = [...new Set([defaultLocale].concat(localeNames || []))]
        await Promise.all(
          locales.map(async locale => {
            const slug = mapping[name] || name
            const pathname = `${attribute}/${slug}`
            const file = {
              data: {
                attributes: {
                  type,
                  layout
                },
                [injectName]: name
              },
              permalink:
                (locale === defaultLocale ? '' : `/${locale}`) +
                `/${attribute}/${slug}`,
              slug
            }

            await plugin.generatePagination(pathname, file, [...posts])
          })
        )
      })
    )
  })
}
