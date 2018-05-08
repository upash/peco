const path = require('path')
const fs = require('fs-extra')
const { makeExecutableSchema } = require('graphql-tools')

const query = {
  async page(root, args, { api }) {
    const route = api.routes.get(args.path)
    if (!route) {
      throw new Error(`Cannot find page for ${query.path}`)
    }
    const path = route.path.replace('dot-peco', api.resolvePecoDir())
    const data = await fs.readFile(path, 'utf8')
    return JSON.parse(data)
  }
}

module.exports = makeExecutableSchema({
  typeDefs: fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8'),
  resolvers: {
    Query: query
  }
})
