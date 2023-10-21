import { JSONSchema4 } from "json-schema"
import { apiMerge } from "api-smart-diff"
import { syncClone } from "json-crawl"
import { merge } from "allof-merge"

import { createJsonSchemaDiffTree, createJsonSchemaTree, jsonSchemaCrawlRules } from "../src"
import { transformCrawlHook } from "../src/transform"

const metaKey = Symbol('diff')

const mergeSchemas = (before: any, after: any, beforeSource: any = before, afterSource: any = after) => {
  const _before = merge(before, { source: beforeSource, mergeRefSibling: true, mergeCombinarySibling: true })
  const _after = merge(after, { source: afterSource, mergeRefSibling: true, mergeCombinarySibling: true })

  const b = syncClone(_before, transformCrawlHook, { rules: jsonSchemaCrawlRules() })
  const a = syncClone(_after, transformCrawlHook, { rules: jsonSchemaCrawlRules() })

  return apiMerge(b, a, { metaKey })
}

describe("jsonschema diff tree tests", () => {
  describe("simple schema", () => {
    it("should create diff tree from simple jsonSchema", () => {
      const before: JSONSchema4 = {
        title: "test",
        type: "string",
        enum: ["a", "b", "c"],
        example: "a",
      }

      const after: JSONSchema4 = {
        title: "test1",
        type: "string",
        enum: ["a", "b", "c", 'd'],
        example: "a2",
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root).toMatchObject({ id: "#", type: "simple", parent: null })
      expect(tree.root?.value()?.$changes).toMatchObject({ 
        title: { action: 'replace' }, 
        enum: { array: { 3: { action: 'add'}}}, 
        examples: { array: { 0: { action: 'replace' }}} 
      })
    })

    it("should create tree from simple jsonSchema with meta", () => {
      const before: JSONSchema4 = {
        title: "test",
        type: "string",
        description: "test description",
        readOnly: true
      }

      const after: JSONSchema4 = {
        title: "test",
        type: "string",
        description: "test description1",
        deprecated: true,
        readOnly: true
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root).toMatchObject({ id: "#", type: "simple", parent: null })
      expect(tree.root?.meta?.$metaChanges).toMatchObject({ 
        deprecated: { action: 'add' }, 
      })
      expect(tree.root?.value()?.$changes).toMatchObject({ 
        description: { action: 'replace' }, 
      })
    })

    it("should create diff tree from object jsonSchema", () => {
      const before: JSONSchema4 = {
        title: "test",
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
        },
      }

      const after: JSONSchema4 = {
        title: "test",
        type: "object",
        required: ["id", "name"],
        properties: {
          id: {
            type: "number",
          },
          name: {
            type: "string",
          },
          test: {
            type: "string",
          },
        },
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root).toMatchObject({ id: "#", type: "simple", parent: null })
      expect(tree.root?.value()?.$changes).toMatchObject({ 
        required: { array: { 1: { action: 'add' }}}, 
      })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: "#/properties/id", kind: "property", key: "id", meta: { required: true }, type: "simple", parent: tree.root },
        { id: "#/properties/name", kind: "property", key: "name", meta: { required: true }, type: "simple", parent: tree.root },
        { id: "#/properties/test", kind: "property", key: "test", meta: { required: false }, type: "simple", parent: tree.root },
      ])
      expect(children[0].value()?.$changes).toMatchObject({ type: { action: 'replace' }})
      expect(children[1].meta?.$metaChanges).toMatchObject({ required: { action: 'add' }})
      expect(children[2].meta?.$nodeChanges).toMatchObject({ action: 'add' })
    })

    it("should create diff tree from jsonSchema with oneOf obejct", () => {
      const before: JSONSchema4 = {
        oneOf: [
          {
            type: "string",
          },
          {
            type: "object",
            required: ['id'],
            properties: {
              id: {
                type: "number",
              },
              name: {
                type: "string",
              },
            },
          },
        ],
      }

      const after: JSONSchema4 = {
        oneOf: [
          {
            type: "string",
          },
          {
            type: "number",
          },
          {
            type: "object",
            required: ['name', 'id'],
            properties: {
              id: {
                type: "number",
              },
              name: {
                type: "string",
              },
            },
          },
        ],
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root).toMatchObject({ id: "#", kind: "root", type: "oneOf", parent: null })

      expect(tree.root?.meta).toMatchObject({ $nestedChanges: { "#/oneOf/2": { action: 'add' } } })
      expect(tree.root?.nested[2].meta).toMatchObject({ $nodeChanges: { action: 'add' } })

      expect(tree.root?.children("#/oneOf/1")[1].meta).toMatchObject({ $metaChanges: { required: { action: 'add' } } })
    })

    it.skip("should create diff tree from jsonSchema with nested oneOf obejct", () => {
      const schema: JSONSchema4 = {
        type: "object",
        required: ["id"],
        oneOf: [
          {
            oneOf: [
              {
                title: "opt1",
                properties: {
                  id: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                },
              },
              {
                title: "opt2",
                properties: {
                  id: {
                    type: "string",
                  },
                  test: {
                    type: "string",
                  },
                },
              },
            ],
          },
          {
            title: "opt3",
            properties: {
              id: {
                type: "number",
              },
              name: {
                type: "string",
              },
            },
          },
        ],
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", kind: "root", type: "oneOf", parent: null })

      expect(tree.root?.value()).toMatchObject({ title: "opt1" })
      expect(tree.root?.value("#/oneOf/0")).toMatchObject({ title: "opt1" })
      expect(tree.root?.value("#/oneOf/0/oneOf/0")).toMatchObject({ title: "opt1" })
      expect(tree.root?.value("#/oneOf/0/oneOf/1")).toMatchObject({ title: "opt2" })
      expect(tree.root?.value("#/oneOf/1")).toMatchObject({ title: "opt3" })
    })

    it("should create diff tree from jsonSchema with additionalProperties", () => {
      const before: JSONSchema4 = {
        type: "object",
        properties: {
          id: {
            type: "string",
          }
        },
        additionalProperties: false
      }

      const after: JSONSchema4 = {
        type: "object",
        properties: {
          id: {
            type: "string",
          }
        },
        additionalProperties: {
          type: "number",
        },
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root?.meta).toMatchObject({ $childrenChanges: { "#/additionalProperties": { action: 'add' } } })
      expect(tree.root?.children()[1].meta).toMatchObject({ $nodeChanges: { action: 'add' } })
    })

    it("should create tree from jsonSchema with patternProperties", () => {
      const before: JSONSchema4 = {
        type: "object"
      }
      const after: JSONSchema4 = {
        type: "object",
        patternProperties: {
          "^[a-z0-9]+$": {
            type: "number",
          },
          "^[0-9]+$": {
            type: "string",
          },
        },
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root?.meta).toMatchObject({ $childrenChanges: { 
        "#/patternProperties/%5E%5B0-9%5D%2B%24": { action: 'add' },
        "#/patternProperties/%5E%5Ba-z0-9%5D%2B%24": { action: 'add' }
      } })

      expect(tree.root?.children()[0].meta).toMatchObject({ $nodeChanges: { action: 'add' } })
      expect(tree.root?.children()[1].meta).toMatchObject({ $nodeChanges: { action: 'add' } })
    })

    it("should create tree from jsonSchema with patternProperties", () => {
      const before: JSONSchema4 = {
        type: "object",
        patternProperties: {
          "^[a-z0-9]+$": {
            type: "string",
          }
        },
      }
      const after: JSONSchema4 = {
        type: "object",
        patternProperties: {
          "^[a-z0-9]+$": {
            type: "number",
          },
          "^[0-9]+$": {
            type: "string",
          },
        },
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root?.meta).toMatchObject({ $childrenChanges: { 
        "#/patternProperties/%5E%5B0-9%5D%2B%24": { action: 'add' }
      } })

      expect(tree.root?.children()[0].value()).toMatchObject({ $changes: { type: { action: 'replace' } } })
    })
  })

  describe("schema with array", () => {
    it("should create diff tree from simple jsonSchema (array type change)", () => {
      const before: JSONSchema4 = {
        type: "array",
        items: {
          type: "string",
        },
      }

      const after: JSONSchema4 = {
        type: "array",
        items: {
          type: "number",
        },
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root?.children()[0].value()).toMatchObject({ $changes: { type: { action: 'replace' } } })
    })

    it("should create diff tree from simple jsonSchema (type change to array)", () => {
      const before: JSONSchema4 = {
        type: "number",
      }

      const after: JSONSchema4 = {
        type: "array",
        items: {
          type: "number",
        },
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root?.value()).toMatchObject({ $changes: { type: { action: 'replace' } } })
      expect(tree.root?.children()[0].meta).toMatchObject({ $nodeChanges: { action: 'add' } })
    })

    it("should create tree from jsonSchema with array items", () => {
      const before: any = {
        type: "array",
        items: [
          {
            type: "string",
          },
          {
            type: "boolean",
          },
        ],
      }
      const after: any = {
        type: "array",
        items: [
          {
            type: "boolean",
          }
        ],
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root?.children()[0].meta).toMatchObject({ $nodeChanges: { action: 'remove' } })
    })

    it("should create tree from jsonSchema with array items", () => {
      const before: any = {
        type: "array",
        items: [
          {
            type: "string",
          },
          {
            type: "boolean",
          },
        ],
      }
      const after: any = {
        type: "array"
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)
      expect(tree.root?.meta).toMatchObject({ $childrenChanges: { 
        "#/items/0": { action: 'remove' },
        "#/items/1": { action: 'remove' } 
      }})

      expect(tree.root?.children()[0].meta).toMatchObject({ $nodeChanges: { action: 'remove' } })
      expect(tree.root?.children()[1].meta).toMatchObject({ $nodeChanges: { action: 'remove' } })
    })

    it.skip("should create diff tree from jsonSchema with array items change", () => {
      const before: any = {
        type: "array",
        items: [
          {
            type: "string",
          },
          {
            type: "boolean",
          },
        ],
      }
      const after: any = {
        type: "array",
        items: {
          type: "string"
        }
      }

      // TODO: api-smart-diff fix needed - expected result:
      const expectedMerged = {
        type: "array",
        items: [
          {
            type: "string",
          },
          {
            type: "boolean",
          },
        ],
        additionalItems: {
          type: "string",
        },
        $diff: {
          items: {
            1: {
              action: 'remove'
            }
          }
        }
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)

      expect(tree.root?.meta).toMatchObject({ $childrenChanges: { 
        "#/items/1": { action: 'remove' } 
      }})

      expect(tree.root?.children()[1].meta).toMatchObject({ $nodeChanges: { action: 'remove' } })
    })
  })

  describe.skip("schema with references", () => {
    it("should create diff tree for jsonSchema with refs", () => {
      const before: JSONSchema4 = {
        type: "object",
        properties: {
          id: { $ref: "#/defs/id" },
        },
        defs: {
          id: {
            title: "id",
            type: "string",
          },
          name: {
            title: "name",
            type: "string",
          },
        },
      }

      const after: JSONSchema4 = {
        type: "object",
        properties: {
          id: { $ref: "#/defs/id" },
          name: { $ref: "#/defs/name" },
        },
        defs: {
          id: {
            title: "id",
            type: "number",
          },
          name: {
            title: "name",
            type: "string",
          },
        },
      }

      const merged = mergeSchemas(before, after)
      const tree = createJsonSchemaDiffTree(merged, metaKey)
      expect(tree.root?.meta).toMatchObject({ $childrenChanges: { name: { action: 'add' }} })
    })

    it("should create tree for jsonSchema with cycle refs", () => {
      const schema: JSONSchema4 = {
        type: "object",
        properties: {
          model: { $ref: "#/defs/model" },
        },
        defs: {
          id: {
            title: "id",
            type: "string",
          },
          model: {
            type: "object",
            properties: {
              id: {
                $ref: "#/defs/id",
              },
              parent: {
                $ref: "#/defs/model",
              },
            },
          },
        },
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", type: "simple", parent: null })

      const model = tree.root?.children()![0]!
      expect(model).toMatchObject({
        id: "#/properties/model",
        type: "simple",
        key: "model",
        kind: "property",
        parent: tree.root,
        ref: "#/defs/model",
      })

      const children = model?.children()
      expect(children).toMatchObject([
        { id: "#/properties/model/properties/id", type: "simple", parent: model, ref: "#/defs/id" },
        {
          id: "#/properties/model/properties/parent",
          type: "simple",
          parent: model,
          ref: "#/defs/model",
          isCycle: true,
        },
      ])
      expect(children[0].value()).toMatchObject(schema.defs!.id)
      expect(children[1].value()).toMatchObject({ type: "object" })
    })
  })

  describe.skip("schema with broken reference", () => {
    it("should create tree for jsonSchema with broken refs", () => {
      const schema: JSONSchema4 = {
        type: "object",
        properties: {
          id: { $ref: "#/defs/id" },
        },
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", type: "simple", parent: null })

      const children = tree.root?.children()!
      expect(children).toMatchObject([{ id: "#/properties/id", type: "simple", parent: tree.root, ref: "#/defs/id" }])
      expect(children[0].value()).toEqual(null)
    })

    it("should create tree for jsonSchema with broken refs in allOf", () => {
      const schema: JSONSchema4 = {
        allOf: [
          {
            type: "string",
          },
          {
            description: "String type",
          },
          {
            $ref: "#/components/schemas/StringPropValidations",
          },
        ],
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", type: "allOf", parent: null })

      const nested = tree.root?.nested!
      expect(nested).toMatchObject([
        { id: "#/allOf/0", type: "simple", parent: null },
        { id: "#/allOf/1", type: "simple", parent: null },
        { id: "#/allOf/2", type: "simple", parent: null, ref: "#/components/schemas/StringPropValidations" },
      ])
      expect(nested[2].value()).toEqual(null)
    })
  })
})
