<template>
  <div></div>
</template>

<script>
const { pageByFile } = graphql`
  {
    pageByFile(filepath: "about.md") {
      permalink
      attributes {
        title
      }
      body
    }
  }
`
console.log(pageByFile)
export default {

}
</script>

