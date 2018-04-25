const resolve = require('resolve')
const install = require('install-packages')

const cache = new Map()

async function localRequire(
  /** @type {string} */
  name,
  /** @type {{version?: string, baseDir?: string, dependencies?: string[]}} */
  options = {},
  triedInstall = false
) {
  const {
    baseDir = process.cwd(),
    version,
    dependencies
  } = options

  const key = baseDir + ':' + name
  let resolved = cache.get(key)
  if (!resolved) {
    try {
      resolved = resolve.sync(name, { basedir: baseDir })
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND' && !triedInstall) {
        await install(
          [version ? `${name}@${version}` : name].concat(dependencies || []),
          baseDir,
          {
            peerFilter(name) {
              return name !== 'webpack'
            }
          }
        )
        return localRequire(name, { baseDir, version, dependencies }, true)
      }
      throw err
    }
    cache.set(key, resolved)
  }

  return require(resolved)
}

module.exports = localRequire
