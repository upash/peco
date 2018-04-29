# Theme development

A theme is where you populate layout components, Peco will looks for layout component at `./path/to/theme/layouts` directory.

The layout component for each page is inferred by its type, e.g. the `type` of `index.md` is `index`, the layout component of pages in `index` type default to `index.{vue,js}`:

|Files|Page Type|Default Layout|Fallback Layout|
|---|---|---|---|
|index.md|index|index||
|source/_posts/*.md|post|post|page|
|source/*.md|page|page||
|(categories page)|category|category|index|
|(tags page)|tag|tag|index|

> __FAQ: why is there page type when page layout is basically the same thing?__
>
> Because in this way you can use different layout for the same type, imagine using different layout components for differnt posts? You can!

## Layout component props

Layout component accepts `page` prop:

```typescript
interface Page {
  // parsed front-matter 
  attributes: {
    [k: string]: any
  },
  // Rendered HTML for your markdown
  body?: string
  // first paragraph of body
  excerpt?: string
}
```

For the `page` prop for layout component of `index` `category` `tag` type pages, it has some extra keys:

```typescript
interface IndexPage extends Page {
  posts: Page[]
  pagination: {
    hasNext: boolean
    hasPrev: boolean
    prevLink: string
    nextLink: string
    total: number
    current: number
  }
}
```

## Preprocessors

You can use `ES2015` `Sass` `Stylus` `PostCSS` etc to write your theme.

Note that if you're using config files for these preprocessors, make sure to include them like `postcss.config.js` in your theme directory when publishing on npm.
