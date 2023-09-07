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

export const jsonSchemaNodeType = {
  Any: 'any',
  String: 'string',
  Number: 'number',
  Integer: 'integer',
  Boolean: 'boolean',
  Null: 'null',
  Array: 'array',
  Object: 'object',
} as const 

export const ANNOTATIONS = ['description', 'default', 'examples'] as const
