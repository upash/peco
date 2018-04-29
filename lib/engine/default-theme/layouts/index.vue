<template>
  <div class="main">
    <div class="container">
      <h1 class="title">{{ $siteData.title }}</h1>
      <h2 class="description">{{ $siteData.description }}</h2>
      <div class="post-list">
        <div class="post" v-for="post in page.posts" :key="post.slug">
          <router-link class="post-title" :to="post.permalink">{{ post.attributes.title || post.slug }}</router-link>
          <div class="post-excerpt" v-html="post.excerpt"></div>
        </div>
      </div>
      <div class="pagination" v-if="page.pagination">
        <router-link v-if="page.pagination.hasPrev" :to="page.pagination.prevLink">Prev</router-link>
        <router-link v-if="page.pagination.hasNext" :to="page.pagination.nextLink">Next</router-link>
      </div>
      <div v-else>
        Try adding some markdown files in <code>./source/_posts</code> directory.
        <div class="page-content" v-html="page.body"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { queryPageByPath } from 'peco'

const page = queryPageByPath('/2018/04/29/another-post.html')
console.log(page.attributes)

export default {
  head() {
    return {
      title:
        !this.page.pagination || this.page.pagination.current === 1
          ? this.$siteData.title
          : `${this.$siteData.title} - page ${this.page.pagination.current}`,
      meta: [
        {
          name: 'description',
          content: this.$siteData.description
        }
      ]
    }
  },

  props: ['page']
}
</script>

<style src="../styles/main.css"></style>

<style scoped>
.title {
  font-size: 2.4rem;
  font-weight: 300;
}

.description {
  font-size: 1rem;
  font-weight: 300;
}

.post-list {
  margin-top: 30px;
}

.post-title {
  font-size: 1.4rem;
}
</style>
