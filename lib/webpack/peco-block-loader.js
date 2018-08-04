module.exports = function(source, map) {
  this.callback(
    null,
    `export default function (Component) {
      const json = ${source}
      Component.options.name = json.name
      Component.options.computed = Object.assign({}, Component.options.computed, {
        $page() {
          return json.page
        }
      })
    }`,
    map
  )
}
