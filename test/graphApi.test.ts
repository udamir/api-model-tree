import { buildFromSchema } from "gqlapi"
import { buildSchema } from "graphql"

import { GraphApiState, createGraphApiTree } from "../src"

describe("graphapi transformation tests", () => {
  describe("simple graphapi", () => {
    it("should create tree from simple graphapi", () => {

      const raw = `
      type Query {
        "A Query with 1 required argument and 1 optional argument"
        todo(
          id: ID!
      
          "A default value of false"
          isCompleted: Boolean = false
        ): String!
      }
      `
      const source = buildFromSchema(buildSchema(raw, { noLocation: true }))
      const tree = createGraphApiTree(source)

      expect(tree.root).toMatchObject({ id: "#", kind: "schema", type: "simple", parent: null })
      const children = tree.root!.children()
      expect(children[0]).toMatchObject({ id: "#/queries/todo", kind: "query", type: "simple", depth: 0, parent: tree.root })
      expect(children.length).toEqual(1)
    })

    it("should create state from simple graphapi", () => {

      const raw = `
      directive @limit(offset: Int = 0, limit: Int = 20) on FIELD | FIELD_DEFINITION

      type Object {
          id: ID!
          count: Int 
      } 

      type Query {
        "A Query with 1 required argument and 1 optional argument"
        todo(
          id: ID!
      
          "A default value of false"
          isCompleted: Boolean = false

          abc: String
        ): Object!

        todos: [Object!]! @limit
      }
      `
      const source = buildFromSchema(buildSchema(raw, { noLocation: true }))
      const tree = createGraphApiTree(source)
      const state = new GraphApiState(tree)

      expect(state.root!.node).toMatchObject({ id: "#", kind: "schema", type: "simple", parent: null })
      const children = state.root!.children
      expect(children[0].node).toMatchObject({ id: "#/queries/todo", kind: "query", type: "simple", depth: 0 })
      expect(children[1].node).toMatchObject({ id: "#/queries/todos", kind: "query", type: "simple", depth: 0 })
      expect(children[2].node).toMatchObject({ id: "#/components/directives/limit", kind: "directive", type: "simple", depth: 1 })
      expect(children.length).toEqual(3)
    })

    it("should create state with single operation", () => {

      const raw = `
      directive @limit(offset: Int = 0, limit: Int = 20) on FIELD | FIELD_DEFINITION

      type Query {
        todo: Int!
        todos: [String!]! @limit
      }
      `
      const source = buildFromSchema(buildSchema(raw, { noLocation: true }))
      const tree = createGraphApiTree(source)
      const state = new GraphApiState(tree, "todos")

      expect(state.root!.node).toMatchObject({ id: "#", kind: "schema", type: "simple", parent: null })
      const children = state.root!.children
      expect(children[0].node).toMatchObject({ id: "#/queries/todos", kind: "query", type: "simple", depth: 0 })
      expect(children[1].node).toMatchObject({ id: "#/components/directives/limit", kind: "directive", type: "simple", depth: 1 })
      expect(children.length).toEqual(2)
    })
  })
})
