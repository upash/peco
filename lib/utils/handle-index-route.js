module.exports = route => {
  if (route.endsWith('/index')) {
    return route.replace(/\/index$/, '/')
  }
  return route
}
