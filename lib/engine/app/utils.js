// Copied from VuePress
const utils = {}

const alphanumeric = v => v.replace(/[^\w-]/g, '-')

utils.pathToComponentName = path => {
  if (path.charAt(path.length - 1) === '/') {
    return alphanumeric(`page${path.replace(/\//g, '-') + 'index'}`)
  }
  return alphanumeric(`page${path.replace(/\//g, '-').replace(/\.html$/, '')}`)
}

// commonjs, because we also use the utils as node.js process
module.exports = utils
