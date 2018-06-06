<template>
  <div :class="$style.notfound">
    <div :class="$style.content">
      <h1>404 not found</h1>
      <div :class="$style.body">Looks like you've followed a broken link or entered a URL that doesn't exist on this site.</div>
      <router-link to="/" :class="$style.link">← Back to our site</router-link>
    </div>
  </div>
</template>

<style module>
.notfound {
  display: flex;
  align-items: center;
  padding: 20px 50px;
}

.link {
  text-decoration: none;
  color: blue;
}

.link:hover {
  text-decoration: underline;
}

.body {
  margin: 20px 0;
}

@media screen and (max-width: 768px) {
  .notfound {
    padding: 10px 20px;
  }
}
</style>
