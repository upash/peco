const path = require('path')
const config = require('./config')
const localRequire = require('./local-require')

function getSiteData(config) {
  return {
    title: config.title,
    description: config.description,
    themeConfig: config.themeConfig,
    locales: config.locales,
    defaultLocale: config.defaultLocale || 'en'
  }
}

async function normalizeConfig(config = {}, baseDir) {
  const themePath = await getThemePath(config.theme, baseDir)
  const enginePath = themePath && (await getEnginePath(themePath))

  return {
    siteData: getSiteData(config),
    configData: Object.assign({}, config, {
      themePath,
      enginePath,
      sourceDir: config.sourceDir || 'source',
      permalink: config.permalink || ':year/:month/:day/:slug',
      markdown: config.markdown || {},
      defaultLocale: config.defaultLocale || 'en',
      localeNames: config.locales && Object.keys(config.locales),
      pagination: config.pagination || { perPage: 30 },
      root: config.root || '/'
    })
  }
}

normalizeConfig.getSiteData = getSiteData

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
