const graphql = require('graphql')

module.exports = (api, plugin) => {
  const attributesType = new graphql.GraphQLObjectType({
    name: 'Attributes',
    fields: {
      title: {
        type: graphql.GraphQLString
      },
      date: {
        type: graphql.GraphQLString
      },
      compileTemplate: {
        type: graphql.GraphQLBoolean
      },
      categories: {
        type: new graphql.GraphQLList(graphql.GraphQLString)
      },
      tags: {
        type: new graphql.GraphQLList(graphql.GraphQLString)
      }
    }
  })

  const pageType = new graphql.GraphQLObjectType({
    name: 'Page',
    fields: {
      body: {
        type: graphql.GraphQLString
      },
      permalink: {
        type: graphql.GraphQLString
      },
      slug: {
        type: graphql.GraphQLString
      },
      excerpt: {
        type: graphql.GraphQLString
      },
      attributes: {
        type: attributesType
      }
    }
  })

  api.queryBuilder.addQuery('pageByFile', {
    type: pageType,
    args: {
      filepath: {
        type: graphql.GraphQLString
      }
    },
    async resolve(_, args, { api, loader }) {
      const file = plugin.files.get(args.filepath)
      if (loader) {
        loader.addDependency(api.resolvePecoDir(args.filepath))
      }
      if (!file) {
        throw new Error(`Cannot find file at ${args.filepath}`)
      }
      return file.data
    }
  })

  api.queryBuilder.addQuery('pageByUrl', {
    type: pageType,
    args: {
      url: {
        type: graphql.GraphQLString
      }
    },
    async resolve(_, args, { api, loader }) {
      const [filepath, file] = [...plugin.files.entries()].find(([, file]) => {
        return file.data.permalink === args.url
      })
      if (loader) {
        loader.addDependency(api.resolvePecoDir(filepath))
      }
      if (!file) {
        throw new Error(`Cannot find file at ${args.url}`)
      }
      return file.data
    }
  })
}
