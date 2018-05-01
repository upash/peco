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

  require(name, baseDir = this.options.baseDir) {
    return require(resolveFrom(baseDir, name))
  }

  resolve(name, baseDir = this.options.baseDir) {
    if (name.startsWith('./')) {
      return resolveFrom(baseDir, name)
    }

    return path.dirname(resolveFrom(baseDir, `${name}/package.json`))
  }
}

module.exports = new LocalRequire()
