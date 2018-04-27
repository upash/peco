import Vue from 'vue'
import Meta from 'vue-meta'
import dataMixin from './data-mixin'

Vue.use(Meta, {
  keyName: 'head',
  attribute: 'data-peco',
  ssrAttribute: 'data-peco-server-rendered',
  tagIDKeyName: 'pcid'
})

Vue.mixin(dataMixin)
