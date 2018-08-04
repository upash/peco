const markdown = require('markdown-it')
const plugin = require('../highlight-lines')

const text = `
\`\`\`html {2}
<template>
  <div>{{ msg }}<div>
</template>

<script>
export default {
  data() {
    return {
      msg: 'hello'
    }
  }
}
</script>
\`\`\`

\`\`\`js
<script>
hehe
</script>
\`\`\`
`

test('main', () => {
  const md = markdown({
    highlight: require('../highlight')
  })
  md.use(plugin)
  const html = md.render(text)
  expect(html).toMatchSnapshot()
})
