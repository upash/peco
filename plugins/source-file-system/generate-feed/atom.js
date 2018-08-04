const pecoPkg = require('../../../package')

const echo = (cond, value) => (cond ? value : '')

module.exports = ({ siteData, feedURL, posts }) =>
  `
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${siteData.title}</title>
  ${echo(siteData.description, `<subtitle>${siteData.description}</subtitle>`)}
  <link href="${feedURL}" rel="self"/>
  <link href="${siteData.url}"/>
  <updated>${new Date(posts[0].attributes.date).toISOString()}</updated>
  <id>${siteData.url}</id>
  ${echo(
    siteData.author,
    `<author>
      <name>${siteData.author}</name>
      ${echo(siteData.email, `<email>${siteData.email}</email>`)}
    </author>`
  )}
  <generator uri="http://github.com/egojump/peco/" version="${
    pecoPkg.version
  }">Peco</generator>
  ${posts
    .map(post => {
      const body = post.body // Should strip vue-specific HTML or not?
      const excerpt = post.excerpt || body.slice(0, 240)

      return `<entry>
      <title>${post.attributes.title}</title>
      <link href="${siteData.url + post.permalink}"/>
      <id>${siteData.url + post.permalink}</id>
      <updated>${new Date(post.attributes.date).toISOString()}</updated>
      <content type="html"><![CDATA[${body}]]></content>
      <summary type="html">${excerpt}</summary>
    </entry>`
    })
    .join('\n')}
</feed>
`.trim()
