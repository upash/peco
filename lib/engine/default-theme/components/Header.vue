<template>
  <header class="header">
    <h1 class="title">
      <router-link to="/">
        {{ $siteData.title }}
      </router-link>
    </h1>
  </header>
</template>

<style scoped>
.title {
  margin: 0;
  font-weight: 500;
  font-size: 1.4rem;
}

.title a {
  color: #333;
}

.title a:hover {
  text-decoration: none;
}

.header {
  height: 50px;
  line-height: 50px;
  border-bottom: 1px solid #e2e2e2;
}
</style>
