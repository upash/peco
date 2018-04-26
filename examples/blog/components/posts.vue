<template>
  <div class="posts">
    <div class="post" v-for="post in posts">
      <h2>{{ post.title }}</h2>
    </div>
  </div>
</template>

<script>
export default {
  props: ['posts']
}
</script>
