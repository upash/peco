// Copied from VuePress
const utils = {}

utils.pathToComponentName = function(path) {
  if (path.charAt(path.length - 1) === '/') {
    return `page${path.replace(/\//g, '-') + 'index'}`
  }
  return `page${path.replace(/\//g, '-').replace(/\.html$/, '')}`
}

// commonjs, because we also use the utils as node.js process
module.exports = utils
