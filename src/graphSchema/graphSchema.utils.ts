import { GraphSchemaFragment, IGraphSchemaEnumValueType } from "./graphSchema.types"

export const transformNullable = (value: GraphSchemaFragment): GraphSchemaFragment => {
  const { nullable, args, ...rest } = value
  return nullable ? { ...args ? { args } : {}, oneOf: [ rest, { type: 'null' } ] } : value
}

export const transformDirectives = (value: GraphSchemaFragment): GraphSchemaFragment => {
  if (!("directives" in value) || !value.directives) { return value }

  const { directives = {}, ...rest } = value
  const { deprecated, example, ..._directives } = directives
  const reason = deprecated?.meta?.reason

  const examples = Object.values(example?.meta ?? {})
  return { 
    ...rest, 
    ...Object.keys(_directives).length ? { directives: _directives } : {},
    ...deprecated ? { deprecated: reason ? { reason } : true } : {},
    ...examples.length ? { examples } : {}
  } as GraphSchemaFragment
}

export const transformValues = (value: GraphSchemaFragment): GraphSchemaFragment => {
  if (!("values" in value) || !value.values) { return value }

  const { values, ...rest } = value
  const _values: Record<string, IGraphSchemaEnumValueType> = {}

  for (const key of Object.keys(values)) {
    const { description, deprecationReason } = values[key]
    _values[key] = {
      ...description ? { description } : {},
      ...deprecationReason ? { deprecated: { reason: deprecationReason }} : {}
    }
  }

  return { ...rest, values: _values }
}
