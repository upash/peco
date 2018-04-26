const layouts = {}

const r = require.context('@theme/layouts', false, /\.(js|vue)$/)

r.keys().forEach(fp => {
  const name = fp.replace(/^\.\//, '').replace(/\.(js|vue)$/, '')
  layouts[name] = r(fp).default
})

export default {
  name: 'LayoutManager',
  props: {
    page: {
      required: true,
      type: [Object, Array]
    }
  },
  functional: true,
  render(h, { props, parent }) {
    const meta = parent.$route.meta || {}

    let template

    const { layout } = props.page.attributes

    if (layout) {
      template = layouts[layout]
    } else {
      template = layout.page
    }
    if (layout === 'post' && !template) {
      template = layouts.page
    }
    if (!template) {
      throw new Error('Cannot find layout component: ' + layout)
    }

    return h(template, {
      props: {
        page: {
          ...props.page,
          ...meta.page
        }
      }
    })
  }
}
