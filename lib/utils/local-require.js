const path = require('path')
const resolveFrom = require('resolve-from')

class LocalRequire {
  constructor() {
    this.options = {}
  }

  setOptions(options = {}) {
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined) {
        this.options[key] = options[key]
      }
    })
  }

  require(name) {
    return require(resolveFrom(this.options.baseDir, name))
  }

  resolve(name) {
    if (name.startsWith('./')) {
      return resolveFrom(this.options.baseDir, name)
    }

    return path.dirname(resolveFrom(this.options.baseDir, `${name}/package.json`))
  }
}

module.exports = new LocalRequire()
