import { IJsonSchemaBaseType, JsonSchemaNodeType } from "./jsonSchema.types"

export const jsonSchemaNodeKind = {
  root: 'root',
  definition: "definition",
  property: "property",
  additionalProperties: "additionalProperties",
  patternProperty: "patternProperty",
  items: "items",
  item: "item",
  additionalItems: "additionalItems",
  allOf: "allOf",
  anyOf: "anyOf",
  oneOf: "oneOf",
} as const

export const jsonSchemaNodeTypes = [
  'any', 'string', 'number', 'integer', 'boolean', 'null', 'array', 'object'
] as const 

export const jsonSchemaCommonProps: (keyof IJsonSchemaBaseType)[]  = [
  'type', 'description', 'type', 'title', 'deprecated', 'readOnly', 
  'writeOnly', 'description', 'examples', 'enum', 'default', 'examples'
]

export const jsonSchemaTypeProps: Record<JsonSchemaNodeType, readonly string[]> = {
  any: [...jsonSchemaCommonProps],
  boolean: [...jsonSchemaCommonProps],
  null: [...jsonSchemaCommonProps],
  string: [...jsonSchemaCommonProps, 'format', 'minLength', 'maxLength', 'pattern'],
  number: [...jsonSchemaCommonProps, 'format','multipleOf', 'minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum'],
  integer: [...jsonSchemaCommonProps, 'format','multipleOf', 'minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum'],
  object: [...jsonSchemaCommonProps, 'properties', 'required', 'patternProperties', 'additionalProperties', 'minProperties', 'maxProperties', 'propertyNames'],
  array: [...jsonSchemaCommonProps, 'items', 'additionalItems', 'minItems', 'maxItems', 'uniqueItems'],
} 
