const markdown = require('markdown-it')
const plugin = require('../excerpt')

test('auto', () => {
  const md = markdown()
  const env = {}
  md.use(plugin)
  const html = md.render(
    `
# hello

hello world

oops
  `,
    env
  )
  expect(env).toMatchSnapshot('env')
  expect(html).toMatchSnapshot('html')
})

test('manually', () => {
  const md = markdown({
    html: true
  })
  const env = {}
  md.use(plugin)
  const html = md.render(
    `
# hello
<!-- more -->
hello world

<strong>hehe</strong>

<!-- foo -->

oops
  `,
    env
  )
  expect(env).toMatchSnapshot('env')
  expect(html).toMatchSnapshot('html')
})

test('paragraph only: false', () => {
  const md = markdown()
  const env = {}
  md.use(plugin, {
    paragraphOnly: false
  })
  const html = md.render(
    `
# hello

hello world

oops
  `,
    env
  )
  expect(env).toMatchSnapshot('env')
  expect(html).toMatchSnapshot('html')
})
