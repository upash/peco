const fs = require('fs-extra')

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

    const { localeNames, locale: defaultLocale } = api.config
    const mapping = api.config[nameMapping] || {}

    const list = new Map()

    await Promise.all(
      [...allPosts.entries()].map(async ([name, posts]) => {
        const locales = [...new Set([defaultLocale].concat(localeNames || []))]
        await Promise.all(
          locales.map(async locale => {
            const slug = mapping[name] || name
            const pathname = `${attribute}/${slug}`
            const permalink =
              (locale === defaultLocale ? '' : `/${locale}`) +
              `/${attribute}/${slug}`
            list.set(`${locale}::${name}`, {
              permalink,
              locale,
              name
            })
            const file = {
              data: {
                attributes: {
                  type,
                  layout
                },
                [injectName]: name,
                permalink,
                slug
              }
            }

            await plugin.generatePagination(pathname, file, [...posts])
          })
        )
      })
    )

    await fs.writeFile(
      api.resolvePecoDir('data', `${attribute}.json`),
      JSON.stringify([...list.values()]),
      'utf8'
    )
  })
}
