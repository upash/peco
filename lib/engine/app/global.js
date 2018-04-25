import Vue from 'vue'
import Meta from 'vue-meta'

Vue.use(Meta, {
  keyName: 'head',
  attribute: 'data-peco',
  ssrAttribute: 'data-peco-server-rendered',
  tagIDKeyName: 'pcid'
})

