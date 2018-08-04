import Vue from 'vue'
import Meta from 'vue-meta'
import dataMixin from './data-mixin'
import LayoutManager from './layout'
import './default.css'

Vue.use(Meta, {
  keyName: 'head',
  attribute: 'data-peco',
  ssrAttribute: 'data-peco-server-rendered',
  tagIDKeyName: 'pcid'
})

Vue.mixin(dataMixin)

Vue.component(LayoutManager.name, LayoutManager)
