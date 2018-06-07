const path = require('upath')
const fs = require('fs-extra')

module.exports = (api, plugin) => {
  const feed = Object.assign(
    {
      type: 'atom',
      path: 'atom.xml',
      limit: 20
    },
    api.config.feed
  )

  api.chainWebpack(config => {
    config.plugin('constants').tap(([options]) => [
      Object.assign(options, {
        __FEED_ENABLED__: JSON.stringify(Boolean(api.config.feed)),
        __FEED_PATH__: JSON.stringify(feed.path)
      })
    ])
  })

  api.enhanceAppFiles.add(path.join(__dirname, 'inject.js'))

  if (!api.config.feed) return

  api.hooks.add('onGenerated', async () => {
    const assert = (cond, msg) => {
      if (!cond) throw new Error(msg)
    }

    assert(
      api.siteData.url,
      'You must specify the url of your website in config file!'
    )
    assert(
      api.siteData.title,
      'You must specify the title of your website in config file!'
    )

    console.log(`> Generating for /${feed.path}`)

    const atomCode = require('./atom')({
      siteData: api.siteData,
      feedURL: api.siteData.url + '/' + feed.path,
      posts: plugin.getPosts().slice(0, feed.limit)
    })

    await fs.writeFile(
      api.resolvePecoDir('website', feed.path),
      atomCode,
      'utf8'
    )
  })
}
