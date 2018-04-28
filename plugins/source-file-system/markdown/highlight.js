const Prism = require('prismjs')
const loadLanguages = require('prismjs/components/index.js')

module.exports = (str, lang) => {
  if (!lang || lang === 'text') return str

  lang = lang.toLowerCase()

  if (lang === 'vue') {
    lang = 'html'
  }

  if (!Prism.languages[lang]) {
    try {
      loadLanguages([lang])
    } catch (err) {
      return str
    }
  }

  return Prism.highlight(str, Prism.languages[lang], lang)
}
