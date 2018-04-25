const path = require('path')
const fs = require('fs-extra')
const getPageLink = require('../utils/get-page-link')

module.exports = api => {
  api.hooks.add('buildFiles', async posts => {
    // Write index layout files
    await Promise.all(
      Array.from(api.files.entries()).map(async entry => {
        const [filepath, file] = entry
        const { data } = file

        const prefix = filepath.replace(/\.md$/, '')

        if (data.attributes.type === 'index') {
          if (posts.length === 0) {
            const outFile = api.resolvePecoDir(
              'data',
              `${data.permalink === '/' ? '/index' : data.permalink}.json`
            )
            api.addRouteFromPath(outFile, data.permalink)
            await fs.ensureDir(path.dirname(outFile))
            await fs.writeFile(outFile, JSON.stringify(data), 'utf8')
            return
          }

          const pagination = Object.assign(
            { per_page: 30 },
            data.attributes.pagination
          )

          const totalPages = Math.ceil(posts.length / pagination.per_page)

          await Promise.all(
            new Array(totalPages).fill(null).map(async (_, index) => {
              const page = index + 1
              const route = getPageLink(prefix, page)

              const outFile = api.resolvePecoDir(
                'data',
                `${route === '/' ? '/index' : route}.json`
              )
              api.addRouteFromPath(
                outFile.replace(api.resolvePecoDir(), 'dot-peco'),
                route
              )

              const start = index * pagination.per_page
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
                    posts: posts.slice(start, start + pagination.per_page)
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
