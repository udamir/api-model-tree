import { buildFromSchema } from "gqlapi"
import { apiMerge } from "api-smart-diff"
import { buildSchema } from "graphql"

import { createGraphSchemaDiffTree, createGraphSchemaTree, graphApiCrawlRules, GraphSchemaFragment } from "../src"
import { createTransformCrawlHook } from "../src/transform"
import { syncClone } from "json-crawl"


const metaKey = Symbol('diff')

const mergeGraphApi = (before: any, after: any) => {

  const b = syncClone(before, createTransformCrawlHook(before), { rules: graphApiCrawlRules })
  const a = syncClone(after, createTransformCrawlHook(after), { rules: graphApiCrawlRules })

  return apiMerge(b, a, { metaKey })
}

describe("graphschema transformation tests", () => {
  describe("simple schema", () => {
    it("should create diff tree from simple graphSchema", () => {

      const before = `
      type Query {
        "A Query with 1 required argument and 1 optional argument"
        todo(
          id: ID      
        ): String
      }
      `
      const beforeSource = buildFromSchema(buildSchema(before, { noLocation: true }))

      const after = `
      type Query {
        "A Query with 1 required argument and 1 optional argument"
        todo(
          id: ID!
      
          "A default value of false"
          isCompleted: Boolean = false
        ): Int
      }
      `
      const afterSource = buildFromSchema(buildSchema(after, { noLocation: true }))

      const merged = mergeGraphApi(beforeSource, afterSource)
      const schema = merged.queries!.todo

      const tree = createGraphSchemaDiffTree(schema, metaKey, merged)

      expect(tree.root?.value()?.$changes).toMatchObject({ type: { action: 'replace' }})
      expect(tree.root?.nested[-1]?.meta.$childrenChanges).toMatchObject({ "#/args/properties/isCompleted": { action: 'add' } })
      expect(tree.root?.nested[-1]?.children()[0]?.meta.$metaChanges).toMatchObject({ required: { action: 'add' } })
    })
  })

  describe.skip("schema with directives", () => {
    it("should create diff tree from graphSchema with directive", () => {

      const before = `
      directive @limit(offset: Int = 0, limit: Int = 20) on FIELD | FIELD_DEFINITION

      type Object {
          id: ID!
          count: Int @limit
      } 

      type Query {
        "A Query with 1 required argument and 1 optional argument"
        todo(
          id: ID!
      
          "A default value of false"
          isCompleted: Boolean = false
        ): Object
      }
      `
      const beforeSource = buildFromSchema(buildSchema(before, { noLocation: true }))
      const after = `
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
          isCompleted: Boolean = false @deprecated(reason: "not used")
        ): Object!
      }
      `
      const afterSource = buildFromSchema(buildSchema(after, { noLocation: true }))

      const merged = mergeGraphApi(beforeSource, afterSource)
      const schema = merged.queries!.todo as GraphSchemaFragment

      const tree = createGraphSchemaDiffTree(schema, metaKey, merged)

    })

    it("should create tree from graphSchema with directive in enum", () => {

      const raw = `
      directive @limit(offset: Int = 0, limit: Int = 20) on FIELD | FIELD_DEFINITION
      directive @example(value: String) on FIELD | FIELD_DEFINITION

      type Object {
          """Id of the object"""
          id: ID @deprecated
          name: String @example(value: "dog") @deprecated
          """Star Wars trilogy"""
          episode: Episode!
      }
      
      enum Episode {
          """episode 1"""
          NEWHOPE
          """episode 2"""
          EMPIRE @deprecated (reason: "was deleted")
          JEDI
          NEWEPISOE
      } 

      type Query {
        "A Query with 1 required argument and 1 optional argument"
        todo: Object!
      }
      `
      const source = buildFromSchema(buildSchema(raw, { noLocation: true }))
      const schema = source.queries!.todo as GraphSchemaFragment

      const tree = createGraphSchemaTree(schema, source)
      expect(tree.root!.value()).toMatchObject({ type: 'object', title: 'Object' })

      const children = tree.root!.children()
      expect(children[0].value()).toMatchObject({ type: 'string', format: 'ID' })      
      expect(children[0].meta).toMatchObject({ deprecated: true })      
      expect(children[1].value()).toMatchObject({ type: 'string', examples: ['dog'] })      
      expect(children[1].meta).toMatchObject({ deprecated: true })      
      expect(children[2].value()).toMatchObject({ type: 'string', enum: ['NEWHOPE', 'EMPIRE', 'JEDI', 'NEWEPISOE'], values: { EMPIRE: { deprecated: {reason: 'was deleted' }}}})      
    })

  })
})
