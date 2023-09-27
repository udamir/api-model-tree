import { IGraphSchemaBaseType, GraphSchemaNodeType } from "./graphSchema.types"

export const graphSchemaNodeKind = {
  root: 'root',
  args: 'args',
  arg: 'arg',
  definition: "definition",
  property: "property",
  items: "items",
  allOf: "allOf",
  oneOf: "oneOf",
} as const

export const graphSchemaNodeTypes = [
  'string', 'number', 'integer', 'boolean', 'null', 'array', 'object'
] as const 

export const graphSchemaCommonProps: (keyof IGraphSchemaBaseType)[]  = [
  'type', 'description', 'title', 'deprecated', 'examples', 'default', 'args', 'directives'
]

export const graphSchemaTypeProps: Record<GraphSchemaNodeType, readonly string[]> = {
  boolean: [...graphSchemaCommonProps],
  null: [...graphSchemaCommonProps],
  string: [...graphSchemaCommonProps, 'format', 'enum', 'values'],
  number: [...graphSchemaCommonProps, 'format'],
  integer: [...graphSchemaCommonProps, 'format'],
  object: [...graphSchemaCommonProps, 'properties', 'required'],
  array: [...graphSchemaCommonProps, 'items'],
} 
