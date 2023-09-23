import { GraphSchemaFragment, GraphSchemaTransformFunc } from "./graphSchema.types"

export const transformNullable = (value: GraphSchemaFragment): GraphSchemaFragment => {
  const { nullable, args, ...rest } = value
  return nullable ? { ...args ? { args } : {}, oneOf: [ rest, { type: 'null' } ] } : value
}

export const transformDirectives = (value: GraphSchemaFragment): GraphSchemaFragment => {
  const { deprecated } = value.directives || {}
  return deprecated ? { ...value, deprecated: true } : value
}

export const graphSchemaTransormers: GraphSchemaTransformFunc[] = [
  transformDirectives,
  transformNullable,
]
