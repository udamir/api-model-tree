import type { GraphSchemaNodeType, IGraphSchemaBaseType } from "./graphSchema.types"

export const graphSchemaNodeKinds = ['root', 'args', 'arg', 'definition', 'property', 'items', 'allOf', 'oneOf']

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

export const graphSchemaNodeMetaProps = [
  'deprecated', 'directives', 'args',
]

export const graphSchemaCommonProps: (keyof IGraphSchemaBaseType)[]  = [
  'type', 'description', 'title', 'examples', 'default', 
]

export const graphSchemaNodeValueProps: Record<string, readonly string[]> = {
  boolean: [...graphSchemaCommonProps],
  null: [...graphSchemaCommonProps],
  string: [...graphSchemaCommonProps, 'format', 'enum', 'values'],
  number: [...graphSchemaCommonProps, 'format'],
  integer: [...graphSchemaCommonProps, 'format'],
  object: [...graphSchemaCommonProps, 'required'],
  array: [...graphSchemaCommonProps],
} as const

export const graphSchemaTypeProps: Record<GraphSchemaNodeType, readonly string[]> = {
  boolean: [...graphSchemaNodeValueProps.boolean, ...graphSchemaNodeMetaProps],
  null: [...graphSchemaNodeValueProps.null, ...graphSchemaNodeMetaProps],
  string: [...graphSchemaNodeValueProps.string, ...graphSchemaNodeMetaProps],
  number: [...graphSchemaNodeValueProps.number, ...graphSchemaNodeMetaProps],
  integer: [...graphSchemaNodeValueProps.integer, ...graphSchemaNodeMetaProps],
  object: [...graphSchemaNodeValueProps.object, ...graphSchemaNodeMetaProps, 'properties'],
  array: [...graphSchemaNodeValueProps.array, ...graphSchemaNodeMetaProps, 'items'],
} 
