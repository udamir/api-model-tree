import { GraphSchemaFragment, GraphSchemaTransformFunc } from "./graphSchema.types"

export const transformNullable = (value: GraphSchemaFragment): GraphSchemaFragment => {
  const { nullable, ...rest } = value
  return nullable ? { oneOf: [ rest, { type: 'null' } ] } : value
}

export const transformDirectives = (value: GraphSchemaFragment): GraphSchemaFragment => {
  const { deprecated } = value.directives || {}
  return deprecated ? { ...value, deprecated: true } : value
}

export const graphSchemaTransormers: GraphSchemaTransformFunc[] = [
  transformDirectives,
  transformNullable,
]
