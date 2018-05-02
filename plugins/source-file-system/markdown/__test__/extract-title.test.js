const markdown = require('markdown-it')
const plugin = require('../extract-title')

test('main', () => {
  const md = markdown()
  const env = {}
  md.use(plugin)
  const html = md.render(
    `
# hello __world__

# hoo

wow
  `,
    env
  )

  expect(env).toMatchSnapshot('env')
  expect(html).toMatchSnapshot('html')
})
