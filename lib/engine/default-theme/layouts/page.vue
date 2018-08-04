<template>
  <div class="main">
    <div class="container">
      <Header />
      <h1>{{ page.attributes.title }}</h1>
      <div class="post-meta" v-if="page.attributes.type === 'post'">
        <div class="post-date">
          {{ new Date(page.attributes.date).toLocaleString() }}
        </div>
      </div>
      <div
        class="content"
        v-if="page.attributes.compileTemplate"
        v-html="page.body">
      </div>
      <div
        class="content"
        v-else>
        <slot name="body"></slot>
      </div>
      <div class="tags" v-if="page.attributes.tags">
        <router-link
          class="tag"
           v-for="tag in page.attributes.tags"
           :key="tag"
          :to="$getTagLink(tag)">
          #{{ tag }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'

export default {
  props: ['page'],

  components: {
    Header
  },

  head() {
    return {
      title: this.page.attributes.title
    }
  }
}
</script>


<style>
.content img {
  max-width: 100%;
}

.tags {
  display: flex;
}

.tag {
  background: #e2e2e2;
  border-radius: 3px;
  padding: 5px 8px;
  color: #333;
}

.post-meta {
  color: gray;
}
</style>
