<template>
  <div class="features">
      <div class="feature" v-for="feature in features" :key="feature.title">
        <div class="feature-title">{{ feature.title }}</div>
        <div class="feature-details">{{ feature.details }}</div>
      </div>
    </div>
</template>

<script>
export default {
  props: ['features']
}
</script>

<style scoped lang="stylus">
.features
  display: flex

.feature
  width: 100%
  padding-right: 20px

.feature-title
  font-weight: bold
  font-size: 1.2rem
  margin-bottom: 15px
</style>
