import { JSONSchema4 } from 'json-schema'

import { JsonSchemaTree } from '../src'

const tree = new JsonSchemaTree()

describe('jsonschema transformation tests', () => {
  describe('simple schema', () => {
    it("should create tree from simple jsonSchema", () => {
      const schema: JSONSchema4 = {
        title: 'test',
        type: 'string',
        enum: ['a', 'b', 'c']
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({ fragment: schema })
    })

    it("should create tree from object jsonSchema", () => {
      const schema: JSONSchema4 = {
        title: 'test',
        type: 'object',
        required: ["id"],
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          }
        }
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({  fragment: schema })
      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', key: 'id', type: 'simple', parent: tree.root },
        { id: '#/properties/name', key: 'name', type: 'simple', parent: tree.root }
      ])
      expect(children[0].value()).toMatchObject({ fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ fragment: schema.properties!.name })
    })

    it("should create tree from oneOf obejct jsonSchema", () => {
      const common: JSONSchema4 = {
        title: 'test',
        type: 'object',
        required: ["id"],
      }
      const schema: JSONSchema4 = {
        ...common,
        oneOf: [{
          properties: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
            }
          }
        }, {
          properties: {
            id: {
              type: "number",
            },
            name: {
              type: "string",
            }
          }
        }]
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'oneOf', parent: null })

      expect(tree.root?.value()).toMatchObject({ fragment: { ...common, ...schema.oneOf![0] } })
      expect(tree.root?.value('#/oneOf/0')).toMatchObject({ fragment: { ...common, ...schema.oneOf![0] } })
      expect(tree.root?.value('#/oneOf/1')).toMatchObject({ fragment: { ...common, ...schema.oneOf![1] } })
    })

    it("should create tree from jsonSchema with additionalProperties", () => {
      const schema: JSONSchema4 = {
        title: 'test',
        type: 'object',
        required: ["id"],
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          }
        },
        additionalProperties: {
          type: "number"
        }
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({ fragment: schema })
      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', key: 'id', type: 'simple', parent: tree.root },
        { id: '#/properties/name', key: 'name', type: 'simple', parent: tree.root},
        { id: '#/additionalProperties', key: 'additionalProperties', type: 'simple', parent: tree.root }
      ])

      expect(children[0].value()).toMatchObject({ fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ fragment: schema.properties!.name })
      expect(children[2].value()).toMatchObject({ fragment: schema.additionalProperties })
    })

    it("should create tree from jsonSchema with patternProperties", () => {
      const schema: JSONSchema4 = {
        title: 'test',
        type: 'object',
        required: ["id"],
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          }
        },
        patternProperties: {
          "^[a-z0-9]+$": {
            type: "number"
          },
          "^[0-9]+$": {
            type: "string"
          }
        }
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', type: 'simple', parent: tree.root },
        { id: '#/properties/name', type: 'simple', parent: tree.root },
        { id: '#/patternProperties/%5E%5Ba-z0-9%5D%2B%24', key: '^[a-z0-9]+$', type: 'simple', parent: tree.root },
        { id: '#/patternProperties/%5E%5B0-9%5D%2B%24', key: '^[0-9]+$', type: 'simple', parent: tree.root }
      ])

      expect(children[0].value()).toMatchObject({ fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ fragment: schema.properties!.name })
      expect(children[2].value()).toMatchObject({ fragment: schema.patternProperties!['^[a-z0-9]+$'] })
      expect(children[3].value()).toMatchObject({ fragment: schema.patternProperties!['^[0-9]+$'] })
    })
  })

  describe('schema with array', () => {
    it("should create tree from simple array jsonSchema", () => {
      const schema: JSONSchema4 = {
        title: 'test',
        type: 'array',
        items: {
          type: "string"
        }
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({ fragment: schema })

      expect(tree.root?.children()).toMatchObject([{ id: '#/items', key: 'items', type: 'simple', parent: tree.root }])
      expect(tree.root?.children()[0].value()).toMatchObject({ fragment: schema.items })
    })
  })

  describe('schema with references', () => {
    it("should create tree from simple jsonSchema", () => {
      const schema: JSONSchema4 = {
        type: 'object',
        properties: {
          id: { $ref: "#/defs/id" },
          name: { $ref: "#/defs/name" },
        },
        defs: {
          id: {
            title: 'id',
            type: 'string',
          },
          name: {
            title: 'name',
            type: 'string',
          } 
        }
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', type: 'simple', parent: tree.root, ref: '#/defs/id' },
        { id: '#/properties/name', type: 'simple', parent: tree.root, ref: '#/defs/name' }
      ])
      expect(children[0].value()).toMatchObject({ fragment: schema.defs!.id })
      expect(children[1].value()).toMatchObject({ fragment: schema.defs!.name })

      const nodes = [...tree.nodes.values()]

      expect(nodes).toMatchObject([
        { id: '#', type: 'simple', parent: null },
        { id: '#/defs/id', type: 'simple' },
        { id: '#/defs/name', type: 'simple' }
      ])

      expect(nodes[0].value()).toMatchObject({ fragment: schema })
      expect(nodes[1].value()).toMatchObject({ fragment: schema.defs!.id })
      expect(nodes[2].value()).toMatchObject({ fragment: schema.defs!.name })
    })
  })
})