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

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null, value: { fragment: schema } })
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

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null, value: { fragment: schema } })
      expect(tree.root?.children()).toMatchObject([
        { id: '#/properties/id', type: 'simple', parent: tree.root, value: { fragment: schema.properties!.id } },
        { id: '#/properties/name', type: 'simple', parent: tree.root, value: { fragment: schema.properties!.name } }
      ])

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

        }
        ]
      }

      tree.load(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'oneOf', parent: null })
      expect(tree.root?.dimensions).toMatchObject(['oneOf'])

      expect(tree.root?.children('oneOf')).toMatchObject([
        { id: '#/oneOf/0', type: 'simple', parent: tree.root, value: { fragment: { ...common, ...schema.oneOf![0] } } },
        { id: '#/oneOf/1', type: 'simple', parent: tree.root, value: { fragment: { ...common, ...schema.oneOf![1] } } }
      ])

    })
  })
})