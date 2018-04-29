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
