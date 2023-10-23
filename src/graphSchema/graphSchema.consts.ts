import { IGraphSchemaBaseType, GraphSchemaNodeType } from "./graphSchema.types"

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
  object: [...graphSchemaCommonProps, 'properties', 'required'],
  array: [...graphSchemaCommonProps, 'items'],
} as const
