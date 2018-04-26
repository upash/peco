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

  context.renderMeta = () => {
    if (!app.$meta) {
      return ''
    }

    const { title, link, style, script, noscript, meta } = app.$meta().inject()

    return `${meta.text()}
    ${title.text()}
    ${link.text()}
    ${style.text()}
    ${script.text()}
    ${noscript.text()}`
  }

  return app
}
