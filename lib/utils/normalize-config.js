const path = require('path')
const config = require('./config')
const localRequire = require('./local-require')

async function normalizeConfig(config = {}, baseDir) {
  const themePath = await getThemePath(config.theme, baseDir)
  const enginePath = themePath && await getEnginePath(themePath)

  return Object.assign({}, config, {
    themePath,
    enginePath,
    sourceDir: config.sourceDir || 'source',
    permalink: config.permalink || ':year/:month/:day/:slug',
    markdown: config.markdown || {}
  })
}

async function getThemePath(theme, baseDir) {
  theme = theme || path.join(__dirname, '../engine/default-theme')

  if (/^[./]|(^[a-zA-Z]:)/.test(theme)) {
    // Local directory
    theme = path.resolve(baseDir, theme)
  } else {
    // A module
    theme = localRequire.resolve(`peco-theme-${theme}`)
  }

  return theme
}

async function getEnginePath(themePath) {
  const { data: themeConfig = {} } = await config.load(
    // Simply use json config for now
    ['config.json'],
    themePath,
    path.dirname(themePath)
  )

  if (themeConfig.engine) {
    return localRequire.resolve(`peco-engine-${themeConfig.engine}`)
  }

  return path.join(__dirname, '../engine')
}

module.exports = normalizeConfig
