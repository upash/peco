<template>
  <div class="posts">
    <div class="post" v-for="post in posts" :key="post.title">
      <h2>{{ post.title }}</h2>
      <p>{{ post.body }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ['posts']
}
</script>
