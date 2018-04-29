const babel = require('@babel/core')

test('queryPageByPath', () => {
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

  expect(code).toMatchSnapshot()
})
