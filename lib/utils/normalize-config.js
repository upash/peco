const path = require('upath')
const config = require('./config')
const localRequire = require('./local-require')

function getSiteData(config) {
  return {
    title: config.title,
    description: config.description,
    themeConfig: config.themeConfig,
    locales: config.locales,
    locale: config.locale || 'en',
    url: config.url,
    author: config.author,
    email: config.email
  }
}

async function normalizeConfig(config = {}, baseDir) {
  const themePath = await getThemePath(config.theme, baseDir)
  const themeSettings = Object.assign(
    {
      srcDir: '.'
    },
    themePath && (await getThemeSettings(themePath))
  )
  const enginePath = await getEnginePath(
    themeSettings.engine || config.engine,
    themePath
  )

  return {
    siteData: getSiteData(config),
    configData: Object.assign({}, config, {
      themePath,
      themeSettings,
      enginePath,
      sourceDir: config.sourceDir || 'source',
      permalink: config.permalink || ':year/:month/:day/:slug',
      markdown: config.markdown || {},
      locale: config.locale || 'en',
      localeNames: config.locales && Object.keys(config.locales),
      pagination:
        config.pagination === undefined ? { perPage: 30 } : config.pagination,
      root: config.root || '/'
    })
  }
}

normalizeConfig.getSiteData = getSiteData

const LOCAL_RE = /^[./]|(^[a-zA-Z]:)/

async function getThemePath(theme, baseDir) {
  theme = theme || path.join(__dirname, '../engine/default-theme')

  if (LOCAL_RE.test(theme)) {
    // Local directory
    theme = path.resolve(baseDir, theme)
  } else {
    // A module
    theme = localRequire.resolve(`peco-theme-${theme}`)
  }

  return theme
}

async function getThemeSettings(themePath) {
  const { data } = await config.load(
    ['theme.yml', 'theme.toml', 'theme.json'],
    themePath,
    path.dirname(themePath)
  )

  return data
}

async function getEnginePath(engine, themePath) {
  let enginePath

  if (engine) {
    if (LOCAL_RE.test(engine)) {
      enginePath = path.resolve(themePath, engine)
    } else {
      enginePath = localRequire.resolve(`peco-engine-${engine}`)
    }
  } else {
    enginePath = path.join(__dirname, '../engine')
  }

  return enginePath
}

module.exports = normalizeConfig
