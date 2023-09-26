import { buildFromSchema } from "gqlapi"
import { buildSchema } from "graphql"

import { createGraphApiTree } from "../src"

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
        ): String
      }
      `
      const source = buildFromSchema(buildSchema(raw, { noLocation: true }))

      const tree = createGraphApiTree(source)

      expect(tree.root).toMatchObject({ id: "#", kind: "schema", type: "simple", parent: null })
      const children = tree.root!.children()
      expect(children[0]).toMatchObject({ id: "#/queries/todo", kind: "query", type: "simple", depth: 0, parent: tree.root })
      expect(children[1]).toMatchObject({ id: "#/components/directives/include", kind: "directive", type: "simple", parent: tree.root })
      expect(children[2]).toMatchObject({ id: "#/components/directives/skip", kind: "directive", type: "simple", parent: tree.root })

    })
  })
})
