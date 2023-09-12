import { JSONSchema4 } from "json-schema"

import { transformJsonSchema } from "../../src"

describe("json-schema with sibling content should be simplified", function () {
  it("should convert $ref sibling into allOf", () => {
    const schema: JSONSchema4 = {
      $ref: "#/permission",
      type: "object",
      properties: {
        admin: {
          type: "boolean",
        },
      }
    }

    const result = transformJsonSchema(schema)

    expect(result).toEqual({
      allOf: [
        {
          $ref: "#/permission",
        },
        {
          type: "object",
          properties: {
            admin: {
              type: "boolean",
            },
          }
        }
      ]
    })
  })

  it("should merge oneOf and sibling content", function () {
    const result = transformJsonSchema({
      description: 'test',
      oneOf: [
        {
          type: "object",
          properties: {
            key: {
              type: "string",
            },
          },
        },
        {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
      ],
    })

    expect(result).toMatchObject({
      oneOf: [
        {
          description: 'test',
          type: "object",
          properties: {
            key: {
              type: "string",
            },
          },
        },
        {
          description: 'test',
          type: "object",
          additionalProperties: {
            type: "string",
          },
        }
      ],
    })
  })

})
