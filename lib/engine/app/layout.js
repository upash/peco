import default404 from '../default-theme/layouts/404.vue'

const layouts = {}

const r = require.context('@theme-src/layouts', false, /\.(js|vue)$/)

r.keys().forEach(fp => {
  const name = fp.replace(/^\.\//, '').replace(/\.(js|vue)$/, '')
  layouts[name] = r(fp).default
})

if (!layouts['404']) {
  layouts['404'] = default404
}

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
      render(h, { props, children }) {
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

        return h(
          template,
          {
            props: {
              page: props.page
            }
          },
          [
            h(
              'template',
              {
                slot: 'body'
              },
              children
            )
          ]
        )
      }
    }

export default LayoutManager
