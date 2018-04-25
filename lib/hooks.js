class Hooks {
  constructor() {
    this.hooks = new Map()
  }

  add(name, handler) {
    if (!handler) return
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set())
    }
    const hooks = this.hooks.get(name)
    hooks.add(handler)
    return this
  }

  addFrom(name, source) {
    if (source[name]) {
      this.add(name, source[name].bind(source))
    }
    return this
  }

  async run(name, context) {
    if (!this.hooks.has(name)) return
    for (const hook of this.hooks.get(name)) {
      await hook(context)
    }
  }
}

module.exports = new Hooks()
