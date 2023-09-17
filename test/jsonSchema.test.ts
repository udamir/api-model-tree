import { JSONSchema4 } from 'json-schema'

import { createJsonSchemaTree } from '../src'

describe('jsonschema transformation tests', () => {
  describe('simple schema', () => {
    it("should create tree from simple jsonSchema", () => {
      const schema: JSONSchema4 = {
        title: 'test',
        type: 'string',
        enum: ['a', 'b', 'c'],
        example: 'a'
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })
      const { example, ...rest } = schema
      expect(tree.root?.value()).toMatchObject({ _fragment: { ...rest, examples: [schema.example] }})
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

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', kind: 'root', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({ _fragment: schema })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', kind: 'property', key: 'id', type: 'simple', parent: tree.root },
        { id: '#/properties/name', kind: 'property', key: 'name', type: 'simple', parent: tree.root }
      ])
      expect(children[0].value()).toMatchObject({ _fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.properties!.name })
    })

    it("should create tree from jsonSchema with oneOf obejct", () => {
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

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', kind: 'root', type: 'oneOf', parent: null })

      expect(tree.root?.value()).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0] } })
      expect(tree.root?.value('#/oneOf/0')).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0] } })
      expect(tree.root?.value('#/oneOf/1')).toMatchObject({ _fragment: { ...common, ...schema.oneOf![1] } })
    })

    it("should create tree from jsonSchema with nested oneOf obejct", () => {
      const common: JSONSchema4 = {
        title: 'test',
        type: 'object',
        required: ["id"],
      }
      const schema: JSONSchema4 = {
        ...common,
        oneOf: [{
          oneOf: [{
            properties: {
              id: {
                type: "string",
              },
              name: {
                type: "string",
              }
            }
          },{
            properties: {
              id: {
                type: "string",
              },
              test: {
                type: "string",
              }
            }
          }]
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

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', kind: 'root', type: 'oneOf', parent: null })

      expect(tree.root?.value()).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0]!.oneOf![0] }})
      expect(tree.root?.value('#/oneOf/0')).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0]!.oneOf![0] }})
      expect(tree.root?.value('#/oneOf/0/oneOf/0')).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0]!.oneOf![0] }})
      expect(tree.root?.value('#/oneOf/0/oneOf/1')).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0]!.oneOf![1] }})
      expect(tree.root?.value('#/oneOf/1')).toMatchObject({ _fragment: { ...common, ...schema.oneOf![1] }})
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

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', kind: 'root', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({ _fragment: schema })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', kind: 'property', key: 'id', type: 'simple', parent: tree.root },
        { id: '#/properties/name', kind: 'property', key: 'name', type: 'simple', parent: tree.root},
        { id: '#/additionalProperties', kind: 'additionalProperties', key: 'additionalProperties', type: 'simple', parent: tree.root }
      ])

      expect(children[0].value()).toMatchObject({ _fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.properties!.name })
      expect(children[2].value()).toMatchObject({ _fragment: schema.additionalProperties })
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

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', kind: 'property', type: 'simple', parent: tree.root },
        { id: '#/properties/name', kind: 'property', type: 'simple', parent: tree.root },
        { id: '#/patternProperties/%5E%5Ba-z0-9%5D%2B%24', kind: 'patternProperty', key: '^[a-z0-9]+$', type: 'simple', parent: tree.root },
        { id: '#/patternProperties/%5E%5B0-9%5D%2B%24', kind: 'patternProperty', key: '^[0-9]+$', type: 'simple', parent: tree.root }
      ])

      expect(children[0].value()).toMatchObject({ _fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.properties!.name })
      expect(children[2].value()).toMatchObject({ _fragment: schema.patternProperties!['^[a-z0-9]+$'] })
      expect(children[3].value()).toMatchObject({ _fragment: schema.patternProperties!['^[0-9]+$'] })
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

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({ _fragment: schema })

      expect(tree.root?.children()).toMatchObject([{ id: '#/items', kind: 'items', key: 'items', type: 'simple', parent: tree.root }])
      expect(tree.root?.children()[0].value()).toMatchObject({ _fragment: schema.items })
    })

    it("should create tree from jsonSchema with array items", () => {
      const schema = {
        title: 'test',
        type: 'array',
        items: [
          {
            type: "string"
          },
          {
            type: "boolean"
          },
        ],
        additionalItems: {
          type: "number"
        }
      }

      const tree = createJsonSchemaTree(schema as JSONSchema4)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })
      expect(tree.root?.value()).toMatchObject({ _fragment: schema })

      expect(tree.root?.children()).toMatchObject([
        { id: '#/items/0', kind: 'item', key: 0, type: 'simple', parent: tree.root },
        { id: '#/items/1', kind: 'item', key: 1, type: 'simple', parent: tree.root },
        { id: '#/additionalItems', kind: 'additionalItems', key: 'additionalItems', type: 'simple', parent: tree.root }
      ])
      expect(tree.root?.children()[0].value()).toMatchObject({ _fragment: schema.items![0] })
      expect(tree.root?.children()[1].value()).toMatchObject({ _fragment: schema.items![1] })
      expect(tree.root?.children()[2].value()).toMatchObject({ _fragment: schema.additionalItems })
    })
  })

  describe('schema with references', () => {
    it("should create tree for jsonSchema with refs", () => {
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

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', type: 'simple', parent: tree.root, ref: '#/defs/id' },
        { id: '#/properties/name', type: 'simple', parent: tree.root, ref: '#/defs/name' }
      ])
      expect(children[0].value()).toMatchObject({ _fragment: schema.defs!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.defs!.name })

      const nodes = [...tree.nodes.values()]

      expect(nodes).toMatchObject([
        { id: '#', kind: 'root', type: 'simple', parent: null },
        { id: '#/defs/id', kind: 'definition', type: 'simple' },
        { id: '#/defs/name', kind: 'definition', type: 'simple' }
      ])

      const { defs, ...rest } = schema
      expect(nodes[0].value()).toMatchObject({ _fragment: rest })
      expect(nodes[1].value()).toMatchObject({ _fragment: schema.defs!.id })
      expect(nodes[2].value()).toMatchObject({ _fragment: schema.defs!.name })
    })

    it("should create tree for jsonSchema with cycle refs", () => {
      const schema: JSONSchema4 = {
        type: 'object',
        properties: {
          model: { $ref: "#/defs/model" },
        },
        defs: {
          id: {
            title: 'id',
            type: 'string',
          },
          model: {
            type: 'object',
            properties: {
              id: {
                $ref: "#/defs/id"
              },
              parent: {
                $ref: "#/defs/model"
              }
            }
          } 
        }
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })

      const model = tree.root?.children()![0]!
      expect(model).toMatchObject(
        { id: '#/properties/model', type: 'simple', key: 'model', kind: 'property', parent: tree.root, ref: '#/defs/model' }
      )
      expect(model.value()).toMatchObject({ _fragment: schema.defs!.model })

      const children = model?.children()
      expect(children).toMatchObject([
        { id: '#/properties/model/properties/id', type: 'simple', parent: model, ref: '#/defs/id' },
        { id: '#/properties/model/properties/parent', type: 'simple', parent: model, ref: '#/defs/model', isCycle: true }
      ])
      expect(children[0].value()).toMatchObject({ _fragment: schema.defs!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.defs!.model })

    })
  })

  describe('schema with broken reference', () => {
    it("should create tree for jsonSchema with broken refs", () => {
      const schema: JSONSchema4 = {
        type: 'object',
        properties: {
          id: { $ref: "#/defs/id" },
        }
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'simple', parent: null })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: '#/properties/id', type: 'simple', parent: tree.root, ref: '#/defs/id' },
      ])
      expect(children[0].value()).toEqual(null)
    })
    
    it("should create tree for jsonSchema with broken refs in allOf", () => {
      const schema: JSONSchema4 = {
        allOf: [
          {
            type: 'string',
          },
          {
            description: 'String type'
          },
          {
            $ref: '#/components/schemas/StringPropValidations'
          }
        ]
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: '#', type: 'allOf', parent: null })

      const nested = tree.root?.nested!
      expect(nested).toMatchObject([
        { id: '#/allOf/0', type: 'simple', parent: null },
        { id: '#/allOf/1', type: 'simple', parent: null },
        { id: '#/allOf/2', type: 'simple', parent: null, ref: '#/components/schemas/StringPropValidations' },
      ])
      expect(nested[2].value()).toEqual(null)
    })
  })
})