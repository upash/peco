# Using <style> in Markdown

`<style>` tags in markdown files will be transpiled:

```markdown
---
title: Hello World
---

Let me show you an example:

<button>click this</button>

<style lang="sass">
button
  color: red
</style>
```

This is basically magic, we extract all `<style>` tags in the markdown and let `vue-loader` handle it. So everything that works for `<style>` tag in normal `.vue` file works here too.

Note that `scoped` and `modules` attribute do not work here unless you [set `compileTemplate: true` in front-matter](./using-vue-template-in-markdown.md).
