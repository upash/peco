<template>
  <div></div>
</template>

<script>
const { page } = graphql`
  {
    page(path: "/about") {
      permalink
      attributes {
        title
      }
      body
    }
  }
`
console.log(page)
export default {

}
</script>

