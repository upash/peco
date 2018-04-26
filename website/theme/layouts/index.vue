<template>
  <div>
    <div class="hero">
      <div class="container">
        <h1 class="title">{{ title }}</h1>
        <h2 class="description">{{ description }}</h2>
      </div>
    </div>
    <div class="container">
      <Features :features="page.attributes.features" />
    </div>
  </div>
</template>

<script>
import Features from '@theme/components/Features.vue'
import { meta } from '@site-data'

export default {
  props: ['page'],

  components: {
    Features
  },

  head: {
    title: meta.title,
    meta: [
      {
        name: 'description',
        content: meta.description
      }
    ]
  },

  data() {
    return {
      ...meta
    }
  }
}
</script>

<style src="@theme/styles/main.styl" lang="stylus"></style>

<style lang="stylus" scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
}

.hero {
  background: #f9f9f9;
  padding: 100px 0;
  margin-bottom: 100px;
}

.title {
  margin: 0;
  font-weight: 300;
  font-size: 3rem;
}

.description {
  margin: 0;
  font-weight: 300;
  color: #797272;
}
</style>

