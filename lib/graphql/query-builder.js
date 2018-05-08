const graphql = require('graphql')

module.exports = class QueryBuilder {
  constructor() {
    this.graphql = graphql
    this.queryFields = {}
  }

  addQuery(name, value) {
    this.queryFields[name] = value
    return this
  }

  buildSchema() {
    this.schema = new graphql.GraphQLSchema({
      query: new graphql.GraphQLObjectType({
        name: 'Query',
        fields: this.queryFields
      })
    })

    return this.schema
  }

  getSchema() {
    return this.schema || this.buildSchema()
  }
}
