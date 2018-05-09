const fs = require('fs-extra')

module.exports = (api, plugin) => {
  let feed = api.config.feed
  if (!feed) return

  feed = Object.assign(
    {
      type: 'atom',
      path: 'atom.xml',
      limit: 20
    },
    feed
  )

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
