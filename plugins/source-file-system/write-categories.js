module.exports = (api, plugin) => {
  api.hooks.add('onBuildIndex', async () => {
    // Group posts by categories
    const allCategories = new Map()
    for (const post of plugin.getPosts()) {
      if (post.attributes.categories) {
        const names = [].concat(post.attributes.categories)
        for (const name of names) {
          if (!allCategories.has(name)) {
            allCategories.set(name, new Set())
          }
          allCategories.get(name).add(post)
        }
      }
    }

    if (allCategories.size === 0) return

    const { categoryMap = {}, localeNames, defaultLocale } = api.config

    await Promise.all(
      [...allCategories.entries()].map(async ([name, posts]) => {
        const locales = [...new Set([defaultLocale].concat(localeNames || []))]
        await Promise.all(
          locales.map(async locale => {
            const slug = categoryMap[name] || name
            const pathname = `categories/${slug}`
            const file = {
              data: {
                attributes: {
                  type: 'category',
                  layout: ['category', 'index']
                },
                category: name
              },
              permalink:
                (locale === defaultLocale ? '' : `/${locale}`) +
                `/categories/${slug}`,
              slug
            }

            await plugin.generatePagination(pathname, file, [...posts])
          })
        )
      })
    )
  })
}
