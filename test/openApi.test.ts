import { createOpenApiTree } from "../src"

describe("openapi transformation tests", () => {
  describe("simple openapi", () => {
    it("should create tree from simple openapi schema", () => {

      const raw = require("./resources/petstore.json")
      const tree = createOpenApiTree(raw)

      expect(tree.root).toMatchObject({ id: "#", kind: "service", type: "simple", parent: null })
      const children = tree.root!.children()
      expect(children.length).toEqual(3)
      expect(children[0]).toMatchObject({ key: "/pets/get", kind: "operation", type: "simple", depth: 0, parent: tree.root })
      expect(children[1]).toMatchObject({ key: "/pets/post", kind: "operation", type: "simple", depth: 0, parent: tree.root })
      expect(children[2]).toMatchObject({ key: '/pets/{petId}/get', kind: "operation", type: "simple", depth: 0, parent: tree.root })
    })
  })
})
