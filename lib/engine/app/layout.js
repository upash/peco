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

        let layoutNames = props.page.attributes.layout
        if (layoutNames === 'post') {
          layoutNames = [layoutNames, 'page']
        } else if (
          layoutNames === 'archive' ||
          layoutNames === 'category' ||
          layoutNames === 'tag'
        ) {
          layoutNames = [layoutNames, 'index']
        }
        layoutNames = [].concat(layoutNames)

        for (const name of layoutNames) {
          if (layouts[name]) {
            template = layouts[name]
            break
          }
        }

        if (!template) {
          throw new Error(
            'Cannot find layout component: ' + layoutNames.join(', ')
          )
        }

        return h(template, {
          props: {
            page: props.page
          }
        })
      }
    }

export default LayoutManager
