module.exports = require('./archive-by-attribute')({
  attribute: 'tags',
  nameMapping: 'tagMap',
  type: 'tag',
  layout: ['tag', 'index'],
  injectName: 'tag'
})
