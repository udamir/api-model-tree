import { isRefNode, parseRef, resolvePointer } from "allof-merge"

import type { GraphSchemaCrawlState, GraphSchemaFragment, IGraphSchemaEnumValueType } from "./graphSchema.types"
import type { SchemaTransformFunc } from "../types"

export const transformNullable: SchemaTransformFunc<GraphSchemaCrawlState>  = (value) => {
  if (typeof value !== "object" || !value || !('nullable' in value)) {
    return value
  }
  const { nullable, args, ...rest } = value as any
  return nullable ? { ...args ? { args } : {}, oneOf: [ rest, { type: 'null' } ] } : value
}

export const transformDirectives: SchemaTransformFunc<GraphSchemaCrawlState>  = (value) => {
  if (typeof value !== "object" || !value || !("directives" in value) || !value.directives) { return value }

  const { directives = {}, deprecated, ...rest } = value as any
  const { example, deprecated: _, ..._directives } = directives

  const examples = Object.values(example?.meta ?? {})
  return { 
    ...rest, 
    ...Object.keys(_directives).length ? { directives: _directives } : {},
    ...deprecated ? { deprecated } : {},
    ...examples.length ? { examples } : {}
  } as GraphSchemaFragment
}

export const transformValues: SchemaTransformFunc<GraphSchemaCrawlState>  = (value) => {
  if (typeof value !== "object" || !value || !("values" in value) || !value.values) { return value }

  const { values, ...rest } = value as any
  const _values: Record<string, IGraphSchemaEnumValueType> = {}

  for (const key of Object.keys(values)) {
    const { description, deprecated } = values[key]
    _values[key] = {
      ...description ? { description } : {},
      ...deprecated ? { deprecated } : {}
    }
  }

  return { ...rest, values: _values }
}

export const transformRef: SchemaTransformFunc<GraphSchemaCrawlState> = (value, source) => {
  // skip if not object or current node graph-schema
  if (!isRefNode(value) ) { return value }

  const { $ref, ...sibling } = value

  if ($ref && Object.keys(sibling).length) {
    // resolve ref
    const _ref = parseRef($ref)
    const refData = resolvePointer(source, _ref.pointer) 
    // merge 
    return refData ? { ...refData, ...sibling } : value
  }

  return value
}

export const GraphSchemaTransformers = [transformDirectives, transformNullable, transformValues, transformRef]
