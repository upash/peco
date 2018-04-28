const layouts = {}

const r = require.context('@theme/layouts', false, /\.(js|vue)$/)

r.keys().forEach(fp => {
  const name = fp.replace(/^\.\//, '').replace(/\.(js|vue)$/, '')
  layouts[name] = r(fp).default
})

// If a theme has `layouts/layout.{vue,js}`
// We leave the layout management to it instead
const LayoutManager = layouts.layout
  ? layouts.layout
  : {
      name: 'LayoutManager',
      props: {
        page: {
          required: true,
          type: [Object, Array]
        }
      },
      functional: true,
      render(h, { props }) {
        let template

        const layoutName = props.page.attributes.layout

        if (layoutName) {
          template = layouts[layoutName]
        }

        if (!template) {
          template = layouts.page
        }

        if (!template) {
          throw new Error('Cannot find layout component: ' + layoutName)
        }

        return h(template, {
          props: {
            page: props.page
          }
        })
      }
    }

export default LayoutManager
