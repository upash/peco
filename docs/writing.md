# Writing

The source markdown files are supposed to be populated at `source` directory by default.

For example a page `source/about.md`:

```markdown
---
title: About me
---

# About

This is how I started...
```

Or a post `source/_posts/hello-world.md`:

```markdown
---
title: Hello World
date: 2018-04-29
---

I started writing blog __just now__!
```

Posts are populated at `source/_posts` folder and they are supposed to have a `date` attribute, otherwise it will default to the time when it was created.
