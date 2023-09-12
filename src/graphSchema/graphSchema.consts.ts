import { IGraphSchemaBaseType, GraphSchemaNodeType } from "./graphSchema.types"

export const graphSchemaNodeKind = {
  root: 'root',
  arg: 'arg',
  directive: 'directive',
  definition: "definition",
  property: "property",
  items: "items",
  allOf: "allOf",
  anyOf: "anyOf",
  oneOf: "oneOf",
} as const

export const graphSchemaNodeTypes = [
  'string', 'number', 'integer', 'boolean', 'null', 'array', 'object'
] as const 

export const jsonSchemaCommonProps: (keyof IGraphSchemaBaseType)[]  = [
  'type', 'description', 'title', 'deprecated', 'examples', 'enum', 'default', 'args', 'directives'
]

export const jsonSchemaTypeProps: Record<GraphSchemaNodeType, readonly string[]> = {
  boolean: [...jsonSchemaCommonProps],
  null: [...jsonSchemaCommonProps],
  string: [...jsonSchemaCommonProps, 'format'],
  number: [...jsonSchemaCommonProps, 'format'],
  integer: [...jsonSchemaCommonProps, 'format'],
  object: [...jsonSchemaCommonProps, 'properties', 'required'],
  array: [...jsonSchemaCommonProps, 'items'],
} 
