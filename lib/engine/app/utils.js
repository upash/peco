// Copied from VuePress
const utils = {}

const alphanumeric = v => v.replace(/[^\w-]/g, '-')

utils.pathToComponentName = path => {
  if (path.charAt(path.length - 1) === '/') {
    return alphanumeric(`page${path.replace(/\//g, '-') + 'index'}`)
  }
  return alphanumeric(`page${path.replace(/\//g, '-').replace(/\.html$/, '')}`)
}

utils.slash = input => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(input)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(input) // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return input
  }

  return input.replace(/\\/g, '/')
}

// commonjs, because we also use the utils as node.js process
module.exports = utils
