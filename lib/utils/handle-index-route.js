module.exports = route => {
  if (route === '/index') return '/'
  if (route.startsWith('/index/page/')) return route.slice(6)
  return route
}
