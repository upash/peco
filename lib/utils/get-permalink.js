const handleIndexRoute = require('./handle-index-route')

module.exports = fp =>
  encodeURI(
    handleIndexRoute('/' + fp.replace(/^_posts\//, '').replace(/\.(md|vue|js)$/, ''))
  )
