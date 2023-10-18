import { IJsonSchemaBaseType, JsonSchemaNodeMeta, JsonSchemaNodeType } from "./jsonSchema.types"

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

export const jsonSchemaNodeKinds = Object.keys(jsonSchemaNodeKind)

export const jsonSchemaNodeTypes = [
  'any', 'string', 'number', 'integer', 'boolean', 'null', 'array', 'object'
] as const 

export const jsonSchemaNodeMetaProps: (keyof JsonSchemaNodeMeta)[]  = [
  'deprecated', 'readOnly', 'writeOnly', 'externalDocs'
]

export const jsonSchemaCommonProps: (keyof IJsonSchemaBaseType)[]  = [
  'type', 'description', 'title', 'enum', 'default', 'examples'
]

export const jsonSchemaNodeValueProps: Record<JsonSchemaNodeType, readonly string[]> = {
  any: [...jsonSchemaCommonProps],
  boolean: [...jsonSchemaCommonProps],
  null: [...jsonSchemaCommonProps],
  string: [...jsonSchemaCommonProps, 'format', 'minLength', 'maxLength', 'pattern'],
  number: [...jsonSchemaCommonProps, 'format','multipleOf', 'minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum'],
  integer: [...jsonSchemaCommonProps, 'format','multipleOf', 'minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum'],
  object: [...jsonSchemaCommonProps, 'required', 'minProperties', 'maxProperties', 'propertyNames'],
  array: [...jsonSchemaCommonProps, 'minItems', 'maxItems', 'uniqueItems'],
} 

export const jsonSchemaTypeProps: Record<JsonSchemaNodeType, readonly string[]> = {
  any: [...jsonSchemaNodeValueProps.any, ...jsonSchemaNodeMetaProps],
  boolean: [...jsonSchemaNodeValueProps.boolean, ...jsonSchemaNodeMetaProps],
  null: [...jsonSchemaNodeValueProps.null, ...jsonSchemaNodeMetaProps],
  string: [...jsonSchemaNodeValueProps.string, ...jsonSchemaNodeMetaProps],
  number: [...jsonSchemaNodeValueProps.number, ...jsonSchemaNodeMetaProps],
  integer: [...jsonSchemaNodeValueProps.integer, ...jsonSchemaNodeMetaProps],
  object: [...jsonSchemaNodeValueProps.object, ...jsonSchemaNodeMetaProps, 'properties', 'patternProperties', 'additionalProperties'],
  array: [...jsonSchemaNodeValueProps.array, ...jsonSchemaNodeMetaProps, 'items', 'additionalItems'],
} 
