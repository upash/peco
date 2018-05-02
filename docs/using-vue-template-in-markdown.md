# Using Vue template in Markdown

Transipilation for [`<style>`](./using-style-in-markdown) tags is always enabled, but you need to manually enable that for Vue templates if you want.

```markdown
---
title: Hello World
compileTemplate: true
data:
  count: 0
---

# Example

<button>{{ count }}</button>
```

You can also:

- use the data from front-matter attribute `data` if you want.
- use `page` to access the `page` prop of this page, like `{{ page.permalink }}`.

