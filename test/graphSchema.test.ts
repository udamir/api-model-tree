import { buildFromSchema } from "gqlapi"
import { buildSchema } from "graphql"

import { createGraphSchemaTree, GraphSchemaFragment, GraphSchemaState, GraphSchemaStatePropNode } from "../src"
import { buildGraphApiSchema } from "./helpers/graphql"

describe("graphschema transformation tests", () => {
  describe("simple schema", () => {
    it("should create tree from simple graphSchema", () => {

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
      const schema = source.queries!.todo as GraphSchemaFragment

      const tree = createGraphSchemaTree(schema)

      const { nullable, args, ...rest } = schema 

      expect(tree.root).toMatchObject({ id: "#", type: "oneOf", parent: null })
      expect(tree.root?.value()).toMatchObject({ type: 'string' })
      expect(tree.root?.meta).toMatchObject({ _fragment: { args, oneOf: [rest, { type: "null" }]} })

      const argsNode = tree.root?.nested[-1]!
      expect(argsNode.meta).toMatchObject({ _fragment: args })
      
      const argsList = argsNode.children()
      expect(argsList[0]).toMatchObject({ key: 'id', type: 'simple', depth: 1 })
      expect(argsList[0].value()).toMatchObject({ type: 'string', format: 'ID' })
      expect(argsList[0].meta).toMatchObject({ _fragment: args?.properties?.id })
      expect(argsList[1]).toMatchObject({ key: 'isCompleted', type: 'simple', depth: 1 })
      expect(argsList[1].value()).toMatchObject({ type: 'boolean', default: false })
      expect(argsList[1].meta).toMatchObject({ _fragment: args?.properties?.isCompleted })

      expect(tree.root?.value('#/oneOf/0')).toMatchObject(rest)
      expect(tree.root?.value('#/oneOf/1')).toMatchObject({ type: 'null' })
    })

    it("should create model state from simple graphSchema", () => {

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
      const schema = source.queries!.todo as GraphSchemaFragment

      const tree = createGraphSchemaTree(schema)
      const state = new GraphSchemaState(tree, 2)
      
      const nodes = state.modelStateNodes()

      expect(nodes[0]).toMatchObject({ type: 'expandable', node: { id: "#", type: "oneOf", parent: null }})
      expect(nodes[1]).toMatchObject({ type: 'basic', first: true, node: { id: "#/args/properties/id", key: 'id', type: 'simple' }})
      expect(nodes[2]).toMatchObject({ type: 'basic', first: false, node: { id: "#/args/properties/isCompleted", key: 'isCompleted', type: 'simple' }})
      expect(nodes[3]).toMatchObject({ type: 'combinary', node: { id: "#", type: "oneOf", parent: null }})

      const root = nodes[0] as GraphSchemaStatePropNode
      root.expanded = false
      
      const collapsedNodes = state.modelStateNodes()
      expect(collapsedNodes.length).toEqual(1)

      expect(root.children.length).toEqual(0)
    })

    it("should create tree from complex graphSchema", () => {
      const source = buildGraphApiSchema('example.graphql')
      const schema = source.queries!.todo as GraphSchemaFragment

      const tree = createGraphSchemaTree(schema, source)

      expect(tree.root).toMatchObject({ id: "#", type: "oneOf", parent: null })
    })
  })

  describe("schema with directives", () => {
    it("should create tree from graphSchema with directive", () => {

      const raw = `
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
      const source = buildFromSchema(buildSchema(raw, { noLocation: true }))
      const schema = source.queries!.todo as GraphSchemaFragment

      const tree = createGraphSchemaTree(schema, source)
      expect(tree.root!.value()).toMatchObject({ type: 'object', title: 'Object' })

      const children = tree.root!.children()
      expect(children[1]).toMatchObject({ key: 'count', type: 'simple' })
      expect(children[1].value()).toMatchObject({ type: 'integer' })      
      expect(children[1].meta).toMatchObject({ directives: { limit: {} } })      
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
