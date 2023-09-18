import { buildFromSchema, GraphApiSchema } from "gqlapi"
import { buildSchema } from "graphql"
import path from "path"
import fs from "fs"

import { createGraphSchemaTree } from "../src"

const buildGraphApiSchema = (filename: string): GraphApiSchema => {
  const resPath = path.join(__dirname, "./resources/", filename)
  const raw = fs.readFileSync(resPath, "utf8")
  const schema = buildSchema(raw, { noLocation: true })
  return buildFromSchema(schema)
}

describe("graphschema transformation tests", () => {
  describe("simple schema", () => {
    it("should create tree from simple jsonSchema", () => {

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
      const schema = source.queries!.todo

      const tree = createGraphSchemaTree(schema)

      const { nullable, ...rest } = schema 

      expect(tree.root).toMatchObject({ id: "#", type: "oneOf", parent: null })
      expect(tree.root?.value()).toMatchObject({ type: 'string', _fragment: rest })

      const args = tree.root?.nested[0].children()[0]!
      expect(args.value()).toMatchObject({ _fragment: rest.args })
      
      const argsList = args.children()
      expect(argsList[0]).toMatchObject({ key: 'id', type: 'simple' })
      expect(argsList[0].value()).toMatchObject({ type: 'string', format: 'ID', _fragment: rest.args?.properties?.id })
      expect(argsList[1]).toMatchObject({ key: 'isCompleted', type: 'simple' })
      expect(argsList[1].value()).toMatchObject({ type: 'boolean', default: false, _fragment: rest.args?.properties?.isCompleted })

      expect(tree.root?.value('#/oneOf/0')).toMatchObject({ _fragment: rest })
      expect(tree.root?.value('#/oneOf/1')).toMatchObject({ type: 'null' })
    })

    it("should create tree from complex jsonSchema", () => {
      const source = buildGraphApiSchema('example.graphql')
      const schema = source.queries!.todo

      const tree = createGraphSchemaTree(schema, source)

      expect(tree.root).toMatchObject({ id: "#", type: "oneOf", parent: null })
    })
  })
})
