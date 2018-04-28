<template>
  <div class="main">
    <div class="container">
      <h1>{{ page.attributes.title }}</h1>
      <div class="content" v-if="page.attributes.compile">
        <slot name="body"></slot>
      </div>
      <div class="content" v-html="page.body"></div>
      <router-link to="/">🏠 go home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  props: ['page'],

  head() {
    return {
      title: this.page.attributes.title
    }
  }
}
</script>

<style src="../styles/main.css"></style>

<style>
.content img {
  max-width: 100%;
}
</style>
