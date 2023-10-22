import { JSONSchema4 } from "json-schema"

import { filterValidProps, transformAdditionalProperties, transformTypeOfArray } from "../../src"

describe('json-schema with complex type should be simplified', () => {
  it('should simplify array type with scalars', () => {
    const schema: JSONSchema4 = {
      type: ['string', 'number'],
      description: 'test',
      maxLength: 100,
      minimum: 0
    }

    const result = transformTypeOfArray(schema, schema, [], { parent: null })

    expect(result).toMatchObject({
      anyOf: [
        {
          type: 'string',
          description: 'test',
          maxLength: 100,
        },
        {
          type: 'number',
          description: 'test',
          minimum: 0    
        }
      ]
    })
  })

  it('should simlify array type and nullable', () => {
    const schema: JSONSchema4 = {
      type: ['string', 'number'],
      nullable: true,
      description: 'test',
      maxLength: 100,
      minimum: 0
    }

    const result = transformTypeOfArray(schema, schema, [], { parent: null })

    expect(result).toMatchObject({
      anyOf: [
        {
          type: 'string',
          description: 'test',
          maxLength: 100,
        },
        {
          type: 'number',
          description: 'test',
          minimum: 0    
        },
        {
          type: 'null',
          description: 'test',
        }
      ]
    })
  })

  it('should simlify array type of object and array', () => {
    const schema: JSONSchema4 = {
      type: ['object', 'array'],
      description: 'test',
      nullable: true,
      required: ['id'],
      properties: {
        id: { type: 'string' }
      },
      items: {
        type: 'string'
      },
      uniqueItems: true
    }

    const result = transformTypeOfArray(schema, schema, [], { parent: null })

    expect(result).toMatchObject({
      anyOf: [
        {
          type: 'object',
          description: 'test',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          },
        },
        {
          type: 'array',
          description: 'test',
          items: {
            type: 'string'
          },
          uniqueItems: true 
        },
        {
          type: 'null',
          description: 'test',
        }
      ]
    })
  })

  it('should not simlify if nullable false', () => {
    const schema: JSONSchema4 = {
      type: 'object', 
      description: 'test',
      nullable: false,
      required: ['id'],
      properties: {
        id: { type: 'string' }
      },
    }

    const result = transformTypeOfArray(schema, schema, [], { parent: null })

    const { nullable, ...rest } = schema
    expect(result).toMatchObject(rest)
  })

  it('should remove in object type wrong validators', () => {
    const schema: JSONSchema4 = {
      type: 'object', 
      description: 'test',
      required: ['id'],
      properties: {
        id: { type: 'string' }
      },
      uniqueItems: true,
      maximum: 5
    }

    const result = filterValidProps(schema, schema, [], { parent: null })

    const { maximum, uniqueItems, ...rest } = schema

    expect(result).toMatchObject(rest)
  })

  it('should remove in array type wrong validators', () => {
    const schema: JSONSchema4 = {
      type: 'object', 
      description: 'test',
      required: ['id'],
      properties: {
        id: { type: 'string' }
      },
      maxProperties: 5,
      additionalProperties: true,
      uniqueItems: true,
      maximum: 5
    }

    const result = transformAdditionalProperties(filterValidProps(schema, schema, [], { parent: null }), schema, [], { parent: null })

    const { maximum, uniqueItems, ...rest } = schema

    expect(result).toMatchObject({ 
      ...rest,
      additionalProperties: {
        type: 'any'
      }
    })
  })

})