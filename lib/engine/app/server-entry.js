import createApp from 'dot-peco/create-app'

export default async context => {
  const { app, router } = createApp()

  const { fullPath } = router.resolve(context.url).route

  if (fullPath !== context.url) {
    throw new Error(`404 not found: ${context.url}`)
  }

  router.push(context.url)

  const onReady = () =>
    new Promise(resolve => {
      router.onReady(() => resolve())
    })

  await onReady()

  const { title, link, style, script, noscript, meta, htmlAttrs, bodyAttrs } = app.$meta().inject()

  context.renderMeta = () => {
    return `${meta.text()}
    ${title.text()}
    ${link.text()}
    ${style.text()}
    ${script.text()}
    ${noscript.text()}`
  }

  context.renderHtmlAttrs = () => {
    return htmlAttrs.text()
  }

  context.renderBodyAttrs = () => {
    return bodyAttrs.text()
  }

  return app
}
