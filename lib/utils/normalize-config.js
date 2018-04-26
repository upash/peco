const path = require('path')
const config = require('./config')
const localRequire = require('./local-require')

function getSiteMeta(config) {
  return {
    title: config.title,
    description: config.description,
    themeConfig: config.themeConfig
  }
}

async function normalizeConfig(config = {}, baseDir) {
  const themePath = await getThemePath(config.theme, baseDir)
  const enginePath = themePath && await getEnginePath(themePath)

  return {
    siteMeta: getSiteMeta(config),
    configData: {
      themePath,
      enginePath,
      sourceDir: config.sourceDir || 'source',
      permalink: config.permalink || ':slug',
      markdown: config.markdown || {},
      googleAnalytics: config.googleAnalytics
    }
  }
}

normalizeConfig.getSiteMeta = getSiteMeta

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
