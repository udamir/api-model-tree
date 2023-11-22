import { buildFromSchema } from 'gqlapi'
import { apiMerge } from 'api-smart-diff'
import { buildSchema } from 'graphql'

import {
  createGraphSchemaDiffTree,
  createGraphSchemaTree,
  createTransformCrawlHook,
  graphApiCrawlRules,
  GraphSchemaFragment,
  IGraphSchemaStringType
} from '../src'
import { syncClone } from 'json-crawl'

const metaKey = Symbol('diff')

const mergeGraphApi = (before: any, after: any) => {

  const b = syncClone(before, createTransformCrawlHook(before), { rules: graphApiCrawlRules })
  const a = syncClone(after, createTransformCrawlHook(after), { rules: graphApiCrawlRules })

  return apiMerge(b, a, { metaKey })
}

describe('graphschema transformation tests', () => {
  describe('simple schema', () => {
    it('should create diff tree from simple graphSchema', () => {

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

      expect(tree.root?.value()?.$changes).toMatchObject({ type: { action: 'replace' } })
      expect(tree.root?.nested[-1]?.meta.$childrenChanges).toMatchObject({ '#/args/properties/isCompleted': { action: 'add' } })
      expect(tree.root?.nested[-1]?.children()[0]?.meta.$metaChanges).toMatchObject({ required: { action: 'add' } })
    })

    it('should create diff tree from graphSchema with directive', () => {

      const before = `
      type Query {
        "A Query with 1 required argument and 1 optional argument"
        todo(
          id: ID!
      
          "A default value of false"
          isCompleted: Boolean = false
        ): String!
      }
      `
      const beforeSource = buildFromSchema(buildSchema(before, { noLocation: true }))
      const after = `
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
      expect(tree.root!.value()).toMatchObject({ type: 'object', title: 'Object' })

      const children = tree.root!.children()
      expect(children[0].value()).toMatchObject({ type: 'string', format: 'ID' })
      expect(children[0].meta).toMatchObject({ $nodeChange: { action: 'add' } })

      expect(children[1].value()).toMatchObject({ type: 'integer' })
      expect(children[1].meta).toMatchObject({ $nodeChange: { action: 'add' } })

    })
  })

  describe('simple schema with complex enum', () => {
    it('changed enum item description', () => {
      const before = `
      directive @example(value: String) on FIELD | FIELD_DEFINITION

      type Object {
          """Id of the object"""
          id: ID @deprecated
          name: String @example(value: "dog") @deprecated (reason: "was deleted")
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
      `

      const beforeSource = buildFromSchema(buildSchema(before, { noLocation: true }))

      const after = `
      directive @example(value: String) on FIELD | FIELD_DEFINITION

      type Object {
          """Id of the object"""
          id: ID @deprecated
          name: String @example(value: "dog") @deprecated (reason: "was deleted")
          """Star Wars trilogy"""
          episode: Episode!
      }
      
      enum Episode {
          """episode #1 description"""
          NEWHOPE
          """episode 2"""
          EMPIRE @deprecated (reason: "was deleted")
          JEDI
          NEWEPISOE
      }
      `

      const afterSource = buildFromSchema(buildSchema(after, { noLocation: true }))

      const merged = mergeGraphApi(beforeSource, afterSource)
      const schema = merged.components.objects!.Object

      const tree = createGraphSchemaDiffTree(schema, metaKey, merged)

      expect((tree.root?.children()[2]?.value() as IGraphSchemaStringType).values?.NEWHOPE).toMatchObject({
        description: 'episode #1 description'
      })
      expect(tree.root?.children()[2]?.value()?.$changes).toMatchObject({
        values: {
          NEWHOPE: {
            description: {
              type: 'annotation',
              action: 'replace',
              replaced: 'episode 1'
            }
          }
        }
      })
    })

    it('changed enum item deprecation reason', () => {
      const before = `
      directive @example(value: String) on FIELD | FIELD_DEFINITION

      type Object {
          """Id of the object"""
          id: ID @deprecated
          name: String @example(value: "dog") @deprecated (reason: "was deleted")
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
      `

      const beforeSource = buildFromSchema(buildSchema(before, { noLocation: true }))

      const after = `
      directive @example(value: String) on FIELD | FIELD_DEFINITION

      type Object {
          """Id of the object"""
          id: ID @deprecated
          name: String @example(value: "dog") @deprecated (reason: "was deleted")
          """Star Wars trilogy"""
          episode: Episode!
      }
      
      enum Episode {
          """episode 1"""
          NEWHOPE
          """episode 2"""
          EMPIRE @deprecated (reason: "was deleted by DIFFERENT reason")
          JEDI
          NEWEPISOE
      }
      `

      const afterSource = buildFromSchema(buildSchema(after, { noLocation: true }))

      const merged = mergeGraphApi(beforeSource, afterSource)
      const schema = merged.components.objects!.Object

      const tree = createGraphSchemaDiffTree(schema, metaKey, merged)

      expect((tree.root?.children()[2]?.value() as IGraphSchemaStringType).values?.EMPIRE).toMatchObject({
        deprecated: {
          reason: 'was deleted by DIFFERENT reason'
        }
      })
      expect(tree.root?.children()[2]?.value()?.$changes).toMatchObject({
        values: {
          EMPIRE: {
            deprecated: {
              type: 'annotation',
              action: 'replace',
              replaced: {
                reason: 'was deleted'
              }
            }
          }
        }
      })
    })
  })

  describe('simple schema with oneOf', () => {
    it('added 1 oneOf item', () => {
      const before = `
      type Query {
          "A Query with 1 required argument and 1 optional argument"
          todo(
              id: ID!
      
              "A default value of false"
              isCompleted: Boolean = false
          ): Response
      }
      
      union Response = StringResponse | NumberResponse
      
      type StringResponse {
          title: String
      }
      
      type NumberResponse {
          index: Int
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
          ): Response
      }
      
      union Response = StringResponse | NumberResponse | BooleanResponse
      
      type StringResponse {
          title: String
      }
      
      type NumberResponse {
          index: Int
      }
      
      type BooleanResponse {
          flag: Boolean
      }
      `

      const afterSource = buildFromSchema(buildSchema(after, { noLocation: true }))

      const merged = mergeGraphApi(beforeSource, afterSource)
      const schema = merged.queries!.todo

      const tree = createGraphSchemaDiffTree(schema, metaKey, merged)

      expect(tree.root?.nested[0]?.nested[2]?.meta?.$nodeChange).toMatchObject({
        type: 'non-breaking',
        action: 'add'
      })
    })

    it('removed 1 oneOf item', () => {
      const before = `
      type Query {
          "A Query with 1 required argument and 1 optional argument"
          todo(
              id: ID!
      
              "A default value of false"
              isCompleted: Boolean = false
          ): Response
      }
      
      union Response = StringResponse | NumberResponse | BooleanResponse
      
      type StringResponse {
          title: String
      }
      
      type NumberResponse {
          index: Int
      }
      
      type BooleanResponse {
          flag: Boolean
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
          ): Response
      }
      
      union Response = StringResponse | NumberResponse
      
      type StringResponse {
          title: String
      }
      
      type NumberResponse {
          index: Int
      }
      `

      const afterSource = buildFromSchema(buildSchema(after, { noLocation: true }))

      const merged = mergeGraphApi(beforeSource, afterSource)
      const schema = merged.queries!.todo

      const tree = createGraphSchemaDiffTree(schema, metaKey, merged)

      expect(tree.root?.nested[0]?.nested[2]?.meta?.$nodeChange).toMatchObject({
        type: 'breaking',
        action: 'remove'
      })
    })
  })

  describe("schema with directives", () => {
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

      expect(tree.root?.nested[-1]).not.toEqual(undefined)
      expect(tree.root?.nested.length).toEqual(2)
      expect(tree.root?.nested[0]?.id).toEqual("#/oneOf/0")
      expect(tree.root?.nested[1]?.id).toEqual("#/oneOf/1")
      expect(tree.root?.nested[1]?.meta?.$nodeChange).toMatchObject({
        type: 'breaking',
        action: 'remove'
      })
    })

    it("should create diff tree from graphSchema with custom directives & show diffs between directive usages", () => {
      const before = `
      directive @example(value: String) on FIELD_DEFINITION
      directive @maxlength(value: Int) on FIELD_DEFINITION
       
      type Object {
          id: ID!
       
          description: String @example(value: "Default description") @maxlength(value: 2048)
      }
      `
      const beforeSource = buildFromSchema(buildSchema(before, { noLocation: true }))
      const after = `
      directive @sample(value: String) on FIELD_DEFINITION
      directive @maxlength(value: Int) on FIELD_DEFINITION
       
      type Object {
          id: ID!
       
          description: String @sample(value: "Default description") @maxlength(value: 2048)
      }
      `
      const afterSource = buildFromSchema(buildSchema(after, { noLocation: true }))

      const merged = mergeGraphApi(beforeSource, afterSource)
      const schema = merged.components!.objects!.Object as GraphSchemaFragment

      const tree = createGraphSchemaDiffTree(schema, metaKey, merged)

      const directives = tree.root?.children()?.[1]?.meta?.directives
      expect(directives).toBeDefined()
      expect(Object.keys(directives!).length).toBe(3)
      expect(tree.root?.children()?.[1]?.meta?.$metaChanges).toMatchObject({
        directives: {
          example: {
            type: "breaking",
            action: "remove"
          },
          sample: {
            type: "non-breaking",
            action: "add"
          }
        }
      })
    })

    it.skip("should create tree from graphSchema with directive in enum", () => {

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
      expect(children[2].value()).toMatchObject({
        type: 'string',
        enum: ['NEWHOPE', 'EMPIRE', 'JEDI', 'NEWEPISOE'],
        values: { EMPIRE: { deprecated: { reason: 'was deleted' } } }
      })
    })
  })
})
