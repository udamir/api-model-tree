import { IGraphSchemaBaseType, GraphSchemaNodeType } from "./graphSchema.types"

export const graphSchemaNodeKind = {
  root: 'root',
  args: 'args',
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

export const graphSchemaCommonProps: (keyof IGraphSchemaBaseType)[]  = [
  'type', 'description', 'title', 'deprecated', 'examples', 'enum', 'default', 'args', 'directives'
]

export const graphSchemaTypeProps: Record<GraphSchemaNodeType, readonly string[]> = {
  boolean: [...graphSchemaCommonProps],
  null: [...graphSchemaCommonProps],
  string: [...graphSchemaCommonProps, 'format'],
  number: [...graphSchemaCommonProps, 'format'],
  integer: [...graphSchemaCommonProps, 'format'],
  object: [...graphSchemaCommonProps, 'properties', 'required'],
  array: [...graphSchemaCommonProps, 'items'],
} 
