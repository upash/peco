const hasExcerptMark = value => /<!--\s*more\s*-->/.test(value.trim())

module.exports = (md, { paragraphOnly = true } = {}) => {
  md.renderer.rules.paragraph_close = (...args) => {
    const [tokens, idx, options, env, self] = args

    if (env) {
      if (typeof env.manualExcerpt === 'undefined') {
        env.manualExcerpt = tokens.some(token => {
          return (
            token.type === 'html_block' && hasExcerptMark(token.content)
          )
        })
      }

      if (!env.excerpted && !env.manualExcerpt) {
        env.excerpted = true
        let startIndex = 0
        if (paragraphOnly) {
          for (const [index, token] of tokens.entries()) {
            if (token.type === 'paragraph_open') {
              startIndex = index
              break
            }
          }
        }
        env.excerpt = self.render(tokens.slice(startIndex, idx + 1), options, env)
      }
    }

    return self.renderToken(tokens, idx, options)
  }

  const htmlRule = md.renderer.rules.html_block
  md.renderer.rules.html_block = (...args) => {
    const [tokens, idx, options, env, self] = args
    const token = tokens[idx]

    if (hasExcerptMark(token.content) && env && !env.excerpted) {
      env.excerpt = self.render(tokens.slice(0, idx), options, env)
      env.excerpted = true
    }

    return htmlRule(...args)
  }
}
