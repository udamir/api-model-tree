import { JSONSchema4 } from "json-schema"

import { createJsonSchemaTree } from "../src"

describe("graphschema transformation tests", () => {
  describe("simple schema", () => {
    it("should create tree from simple jsonSchema", () => {
      const schema: JSONSchema4 = {
        title: "test",
        type: "string",
        enum: ["a", "b", "c"],
        nullable: true,
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", type: "simple", parent: null })
      expect(tree.root?.value()).toMatchObject({ _fragment: schema })
    })

    it("should create tree from object jsonSchema", () => {
      const schema: JSONSchema4 = {
        title: "colors",
        description: "A field that requires an argument",
        type: "array",
        items: {
          title: "Color",
          type: "string",
          values: [
            {
              description: "Red color",
              enum: ["RED"],
            },
            {
              description: "Green color",
              enum: ["GREEN"],
            },
          ],
        },
        args: {
          filter: {
            title: "filter",
            required: true,
            schema: {
              type: "array",
              items: {
                $ref: "#/components/enums/Color",
              },
            },
          },
        },
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", kind: "root", type: "simple", parent: null })
      expect(tree.root?.value()).toMatchObject({ _fragment: schema })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: "#/properties/id", kind: "property", key: "id", type: "simple", parent: tree.root },
        { id: "#/properties/name", kind: "property", key: "name", type: "simple", parent: tree.root },
      ])
      expect(children[0].value()).toMatchObject({ _fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.properties!.name })
    })

    it("should create tree from jsonSchema with oneOf obejct", () => {
      const common: JSONSchema4 = {
        title: "test",
        type: "object",
        required: ["id"],
      }
      const schema: JSONSchema4 = {
        ...common,
        oneOf: [
          {
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

      expect(tree.root?.value()).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0] } })
      expect(tree.root?.value("#/oneOf/0")).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0] } })
      expect(tree.root?.value("#/oneOf/1")).toMatchObject({ _fragment: { ...common, ...schema.oneOf![1] } })
    })

    it("should create tree from jsonSchema with nested oneOf obejct", () => {
      const common: JSONSchema4 = {
        title: "test",
        type: "object",
        required: ["id"],
      }
      const schema: JSONSchema4 = {
        ...common,
        oneOf: [
          {
            oneOf: [
              {
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

      expect(tree.root?.value()).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0]!.oneOf![0] } })
      expect(tree.root?.value("#/oneOf/0")).toMatchObject({ _fragment: { ...common, ...schema.oneOf![0]!.oneOf![0] } })
      expect(tree.root?.value("#/oneOf/0/oneOf/0")).toMatchObject({
        _fragment: { ...common, ...schema.oneOf![0]!.oneOf![0] },
      })
      expect(tree.root?.value("#/oneOf/0/oneOf/1")).toMatchObject({
        _fragment: { ...common, ...schema.oneOf![0]!.oneOf![1] },
      })
      expect(tree.root?.value("#/oneOf/1")).toMatchObject({ _fragment: { ...common, ...schema.oneOf![1] } })
    })

    it("should create tree from jsonSchema with additionalProperties", () => {
      const schema: JSONSchema4 = {
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
        additionalProperties: {
          type: "number",
        },
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", kind: "root", type: "simple", parent: null })
      expect(tree.root?.value()).toMatchObject({ _fragment: schema })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: "#/properties/id", kind: "property", key: "id", type: "simple", parent: tree.root },
        { id: "#/properties/name", kind: "property", key: "name", type: "simple", parent: tree.root },
        {
          id: "#/additionalProperties",
          kind: "additionalProperties",
          key: "additionalProperties",
          type: "simple",
          parent: tree.root,
        },
      ])

      expect(children[0].value()).toMatchObject({ _fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.properties!.name })
      expect(children[2].value()).toMatchObject({ _fragment: schema.additionalProperties })
    })

    it("should create tree from jsonSchema with patternProperties", () => {
      const schema: JSONSchema4 = {
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
        patternProperties: {
          "^[a-z0-9]+$": {
            type: "number",
          },
          "^[0-9]+$": {
            type: "string",
          },
        },
      }

      const tree = createJsonSchemaTree(schema)

      expect(tree.root).toMatchObject({ id: "#", type: "simple", parent: null })

      const children = tree.root?.children()!
      expect(children).toMatchObject([
        { id: "#/properties/id", kind: "property", type: "simple", parent: tree.root },
        { id: "#/properties/name", kind: "property", type: "simple", parent: tree.root },
        {
          id: "#/patternProperties/%5E%5Ba-z0-9%5D%2B%24",
          kind: "patternProperty",
          key: "^[a-z0-9]+$",
          type: "simple",
          parent: tree.root,
        },
        {
          id: "#/patternProperties/%5E%5B0-9%5D%2B%24",
          kind: "patternProperty",
          key: "^[0-9]+$",
          type: "simple",
          parent: tree.root,
        },
      ])

      expect(children[0].value()).toMatchObject({ _fragment: schema.properties!.id })
      expect(children[1].value()).toMatchObject({ _fragment: schema.properties!.name })
      expect(children[2].value()).toMatchObject({ _fragment: schema.patternProperties!["^[a-z0-9]+$"] })
      expect(children[3].value()).toMatchObject({ _fragment: schema.patternProperties!["^[0-9]+$"] })
    })
  })
})
