module.exports = (prefix, page) => {
  const res = `/${prefix ? prefix + '/' : ''}${
    page === 1 ? '' : `page/${page}`
  }`

  if (res === '/') return res
  return res.replace(/\/$/, '')
}
