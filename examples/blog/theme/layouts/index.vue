<template>
  <div>
    <div class="post" v-for="post of page.posts" :key="post.permalink">
      <h2>{{ post.attributes.title }}</h2>
      <div class="excerpt" v-html="post.excerpt"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['page']
}
</script>

