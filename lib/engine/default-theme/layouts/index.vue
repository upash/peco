<template>
  <div class="main">
    <div class="container">
      <Header />
      <div class="index-title" v-if="page.tag">
        🏷 Tag: {{ page.tag }}
      </div>
      <div class="index-title" v-if="page.category">
        📁 Category: {{ page.category }}
      </div>
      <div class="post-list">
        <div class="post" v-for="post in page.posts" :key="post.slug">
          <router-link class="post-title" :to="post.permalink">{{ post.attributes.title || post.slug }}</router-link>
          <div class="post-meta">
            <div class="post-date">
              {{ new Date(post.attributes.date).toLocaleString() }}
            </div>
          </div>
          <div class="post-excerpt" v-html="post.excerpt"></div>
        </div>
      </div>
      <div class="pagination" v-if="page.pagination">
        <router-link v-if="page.pagination.hasPrev" :to="page.pagination.prevLink">← Prev</router-link>
        <router-link v-if="page.pagination.hasNext" :to="page.pagination.nextLink">Next →</router-link>
      </div>
      <div v-else>
        Try adding some markdown files in <code>./source/_posts</code> directory.
        <div class="page-content" v-html="page.body"></div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'

export default {
  components: {
    Header
  },

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


<style scoped>
.index-title {
  margin: 20px 0;
  font-size: 1.4rem;
  font-weight: bold;
}

.post-list {
  margin-top: 30px;
}

.post {
  margin-bottom: 20px;
}

.post-title {
  font-size: 1.4rem;
  color: #333;
}

.pagination {
  margin-top: 20px;
}

.post-meta {
  margin-top: 10px;
  color: gray;
}
</style>
