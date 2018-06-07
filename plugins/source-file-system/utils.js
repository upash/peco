const path = require('upath')
const fs = require('fs-extra')

exports.hasMatchedLocale = (locales, link) => {
  return locales.some(locale => {
    const RE = new RegExp(`^/${locale}(/|$)`)
    return RE.test(link)
  })
}

exports.matchLocale = (locale, link) => {
  const RE = new RegExp(`^/${locale}(/|$)`)
  return RE.test(link)
}

exports.addIndexSuffix = route => {
  return route.endsWith('/') ? `${route}index` : route
}

exports.getPageLink = (prefix, page) => {
  const res = `/${prefix ? prefix + '/' : ''}${
    page === 1 ? '' : `page/${page}`
  }`

  if (res === '/') return res
  return res.replace(/\/$/, '')
}

exports.stripHTML = html => {
  html = html || ''
  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi, '').trim()
}

exports.writeIfChanged = async (filepath, data) => {
  const exists = await fs.pathExists(filepath)
  if (exists) {
    const oldData = await fs.readFile(filepath, 'utf8')
    if (data !== oldData) {
      await fs.writeFile(filepath, data, 'utf8')
    }
  } else {
    await fs.ensureDir(path.dirname(filepath))
    await fs.writeFile(filepath, data, 'utf8')
  }
}
