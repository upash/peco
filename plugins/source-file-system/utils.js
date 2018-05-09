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
