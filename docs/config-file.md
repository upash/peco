# Config file

Peco will automatically use one of following config files found in the base dir:

- peco.config.yml
- peco.config.toml
- peco.config.js

## Configurations

### title

- __Type__: `string`

The title for your website, generally used by themes.

### description

- __Type__: `string`

The description for your website, generally used by themes.

### themeConfig

- __Type__: `object`

Theme-specific configurations.

### root

- __Type__: `string`
- __Default__: `/`

The root pathname of your website.

For example, you have to set it to `/blog/` if your website is located at: `https://website.com/blog`.

### sourceDir

- __Type__: `string`
- __Default__: `source`

The directory to your source files, relative to `root` directory.

### permalink

- __Type__: `string`
- __Default__: `:year/:month/:day/:slug`

The permanent link of posts.

|name|description|
|---|---|
|:year|Published year of posts (4-digit)|
|:month|Published month of posts (2-digit)|
|:i_month|Published month of posts (Without leading zeros)|
|:day|Published day of posts (2-digit)|
|:i_day|Published day of posts (Without leading zeros)|
|:slug|Slugified file path (Without extension)|

### pwa

- __Type__: `boolean`
- __Default__: `true`

Enable PWA (Progressive Web App) support.

### googleAnalytics

- __Type__: `string` `object`
- __Default__: `undefined`

Track ID for Google Analytics.

### pagination

- pagination
  - perPage: 
    - __Default__: `30`

Set `pagination` to `false` to disable it.

### categories

- __Type__: `boolean`
- __Default__: `true`

Whether to generate caregory archives.

### tags

- __Type__: `boolean`
- __Default__: `true`

Whether to generate tag archives.

### categoryMap

- __Type__: `object`

Category name to URL path name mapping. e.g.:

```js
{
  'Apple Pencil': 'apple-pencil'
}
```

```yaml
---
categories:
  - Apple Pencil
```

You can access this category page via `/categories/apple-pencil` then.

### tagMap

Same as `categoryMap` for but tags.

### markdown

#### slugify

Use a custom npm package for slugify headers, e.g. use [limax](https://github.com/lovell/limax) for CJK support:

📝 __peco.config.yml__:

```yaml
markdown:
  slugify: limax
```

You can also directory require a package when using JS config file:

📝 __peco.config.js__:

```js
module.exports = {
  markdown: {
    slugify: require('limax')
  }
}
```

#### plugins

- __Type__: An array of `{name: string, options: any}`

```yaml
markdown:
  plugins:
    - name: markdown-it-footnote
      options: # optional options
```
