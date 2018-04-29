const babel = require('@babel/core')

test('queryPage', () => {
  const { code } = babel.transform(
    `
  import { queryPageByPath } from 'peco'

  const page = queryPageByPath('/foo')
  `,
    {
      plugins: [require.resolve('../query-plugin')],
      babelrc: false
    }
  )

  console.log(code)
})
