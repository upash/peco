module.exports = require('./archive-by-attribute')({
  attribute: 'categories',
  nameMapping: 'categoryMap',
  type: 'category',
  layout: ['category', 'index'],
  injectName: 'category'
})
