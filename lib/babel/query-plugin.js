function queryPlugin(babel) {
  return {
    name: 'query-plugin',
    visitor: {
      ImportDeclaration(path, state) {
        const isQuery = looksLike(path, {
          node: {
            source: {
              value: v => v === 'peco'
            }
          }
        })
        if (!isQuery) {
          return
        }
        const imports = path.node.specifiers.map(s => ({
          localName: s.local.name,
          importedName:
            s.type === 'ImportDefaultSpecifier' ? 'default' : s.imported.name
        }))
        const source = path.node.source.value
        applyQuery({
          path,
          imports,
          source,
          state,
          babel
        })
        path.remove()
      },
      VariableDeclaration(path, state) {
        const isQuery = child =>
          looksLike(child, {
            node: {
              init: {
                callee: {
                  type: 'Identifier',
                  name: 'require'
                },
                arguments: args => args.length === 1 && args[0].value === 'peco'
              }
            }
          })

        path
          .get('declarations')
          .filter(isQuery)
          .forEach(child => {
            const imports = child.node.id.name
              ? [{ localName: child.node.id.name, importedName: 'default' }]
              : child.node.id.properties.map(property => ({
                  localName: property.value.name,
                  importedName: property.key.name
                }))

            const call = child.get('init')
            const source = call.node.arguments[0].value
            applyQuery({
              path: call,
              imports,
              source,
              state,
              babel
            })

            child.remove()
          })
      }
    }
  }
}

// eslint-disable-next-line complexity
function applyQuery({ path, imports, babel }) {
  let hasReferences = false
  const referencePathsByImportName = imports.reduce(
    (byName, { importedName, localName }) => {
      byName[importedName] = path.scope.getBinding(localName).referencePaths
      hasReferences = hasReferences || Boolean(byName[importedName].length)
      return byName
    },
    {}
  )

  if (!hasReferences) {
    return
  }

  const { types: t } = babel
  const { queryPageByPath } = referencePathsByImportName

  const validTypes = new Set(['queryPageByPath'])
  for (const key of Object.keys(referencePathsByImportName)) {
    if (!validTypes.has(key)) {
      throw new Error(`You cannot import "${key}" from Peco!`)
    }
  }

  if (queryPageByPath) {
    for (const ref of queryPageByPath) {
      if (ref.parentPath.type === 'CallExpression') {
        const { arguments: args } = ref.parentPath.node
        const hasNonStringType = args.some(arg => arg.type !== 'StringLiteral')
        if (hasNonStringType) {
          throw new Error(
            'The arguments of queryPageByPath have to be string literal!'
          )
        }
        ref.parentPath.replaceWith(
          t.memberExpression(
            t.callExpression(t.identifier('require'), [
              t.stringLiteral(
                `@noop-query?type=queryPageByPath&path=${args[0].value}&key=${
                  args[1] ? args[1].value : ''
                }`
              )
            ]),
            t.identifier('default')
          )
        )
      }
    }
  }
}

function looksLike(a, b) {
  return (
    a &&
    b &&
    Object.keys(b).every(bKey => {
      const bVal = b[bKey]
      const aVal = a[bKey]
      if (typeof bVal === 'function') {
        return bVal(aVal)
      }
      return isPrimitive(bVal) ? bVal === aVal : looksLike(aVal, bVal)
    })
  )
}

function isPrimitive(val) {
  // eslint-disable-next-line
  return val == null || /^[sbn]/.test(typeof val)
}

module.exports = queryPlugin
