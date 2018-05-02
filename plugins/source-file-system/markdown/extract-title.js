module.exports = md => {
  // eslint-disable-next-line camelcase
  md.renderer.rules.heading_open = (...args) => {
    const [tokens, idx, options, env, self] = args

    const token = tokens[idx]
    if (token.tag === 'h1' && !env.title) {
      env.title = tokens[idx + 1].content
      tokens[idx].hidden = true
      tokens[idx + 1].children = []
      tokens[idx + 2].hidden = true
      return ''
    }

    return self.renderToken(tokens, idx, options)
  }
}
