const path = require('path')
const fs = require('fs-extra')
const getPageLink = require('../lib/utils/get-page-link')

const hasMatchedLang = (langs, slug) => {
  return langs.some(lang => {
    const RE = new RegExp(`^${lang}[/$]`)
    return RE.test(slug)
  })
}

const isSlugMatchLang = (slug, lang) => {
  const RE = new RegExp(`^${lang}[/$]`)
  return RE.test(slug)
}

const addIndexSuffix = route => {
  return route.endsWith('/') ? `${route}index` : route
}

module.exports = api => {
  api.hooks.add('buildFiles', async _posts => {
    // Write index layout files
    await Promise.all(
      Array.from(api.files.entries()).map(async entry => {
        // Make a copy of these posts to manipulate in parellel
        let posts = [..._posts]

        const [filepath, file] = entry
        const { data } = file

        const prefix = filepath.replace(/\.md$/, '').replace(/(^|\/)index$/, '')

        if (data.attributes.type === 'index') {
          if (api.config.localeNames) {
            // get locale of current page
            // default locale is null
            let locale = null
            for (const name of api.config.localeNames) {
              if (isSlugMatchLang(data.slug, name)) {
                locale = name
                break
              }
            }

            posts = posts.filter(post => {
              if (locale === null || locale === api.config.defaultLocale) {
                return !hasMatchedLang(api.config.localeNames, post.slug)
              }
              return isSlugMatchLang(post.slug, locale)
            })
          }

          if (posts.length === 0) {
            const outFile = api.resolvePecoDir(
              'data',
              `${addIndexSuffix(data.permalink)}.json`
            )
            api.addRouteFromPath(outFile, data.permalink)
            await fs.ensureDir(path.dirname(outFile))
            await fs.writeFile(outFile, JSON.stringify(data), 'utf8')
            return
          }

          const pagination = Object.assign(
            { perPage: 30 },
            data.attributes.pagination
          )

          const totalPages = Math.ceil(posts.length / pagination.perPage)

          await Promise.all(
            new Array(totalPages).fill(null).map(async (_, index) => {
              const page = index + 1
              const route = getPageLink(prefix, page)

              const outFile = api.resolvePecoDir(
                'data',
                `${addIndexSuffix(route)}.json`
              )
              api.addRouteFromPath(
                outFile.replace(api.resolvePecoDir(), 'dot-peco'),
                route
              )

              const start = index * pagination.perPage
              await fs.ensureDir(path.dirname(outFile))
              await fs.writeFile(
                outFile,
                JSON.stringify(
                  Object.assign({}, data, {
                    pagination: {
                      current: page,
                      total: totalPages,
                      hasPrev: page < totalPages,
                      hasNext: page > 1,
                      nextLink: getPageLink(prefix, page - 1),
                      prevLink: getPageLink(prefix, page + 1)
                    },
                    posts: posts.slice(start, start + pagination.perPage)
                  })
                ),
                'utf8'
              )
            })
          )
        }
      })
    )
  })
}
