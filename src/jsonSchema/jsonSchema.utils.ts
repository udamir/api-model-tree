import { isAnyOfNode, isOneOfNode, parsePointer } from 'allof-merge'

import type { JsonSchemaFragment, JsonSchemaNodeType, JsonSchemaTransformFunc, JsonSchemaTransformedFragment } from './jsonSchema.types'
import { jsonSchemaCommonProps, jsonSchemaTypeProps, jsonSchemaNodeTypes } from './jsonSchema.consts'
import { isAllOfNode, isStringOrNumber, pick } from '../utils'

export const isValidType = (maybeType: unknown): maybeType is JsonSchemaNodeType =>
  typeof maybeType === 'string' && jsonSchemaNodeTypes.includes(maybeType as JsonSchemaNodeType)

export function inferTypes(fragment: JsonSchemaFragment): JsonSchemaNodeType[] {
  const types: JsonSchemaNodeType[] = []
  for (const type of Object.keys(jsonSchemaTypeProps) as JsonSchemaNodeType[]) {
    const props = jsonSchemaTypeProps[type].slice(jsonSchemaCommonProps.length)
    for (const prop of props) {
      if (prop in fragment) {
        types.push(type)
        break
      }
    }
  }

  return types
}

export function unwrapStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function unwrapArrayOrNull(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null
}

export function getRequired(required: unknown): string[] | null {
  if (!Array.isArray(required)) return null
  return required.filter(isStringOrNumber).map(String)
}

export const transformAdditionalItems = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if (value.type === 'array' && 'aditionalItems' in value && value.aditionalItems === true) {
    return { ...value, aditionalItems: { type: 'any' } }  as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export const transformAdditionalProperties = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if (value.type === 'object' && 'additionalProperties' in value && value.additionalProperties === true) {
    return { ...value, additionalProperties: { type: 'any' } } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export const transformConst = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if ('const' in value) {
    const { const: v, ...rest } = value
    return { ...rest, enum: [v] } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export const transformExclusiveMinimum = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if ('exclusiveMinimum' in value && typeof 'exclusiveMinimum' === 'boolean' && 'minimum' in value) {
    const { minimum, exclusiveMinimum, ...rest } = value
    return { ...rest, exclusiveMinimum: minimum } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export const transformExclusiveMaximum = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if ('exclusiveMaximum' in value && typeof 'exclusiveMaximum' === 'boolean' && 'maximum' in value) {
    const { maximum, exclusiveMaximum, ...rest } = value
    return { ...rest, exclusiveMaximum: maximum } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export function transformExample(value: JsonSchemaFragment): JsonSchemaTransformedFragment {
  if ('example' in value) {
    const { example, ...rest } = value
    return { ...rest, examples: [...value.examples, example] } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export const transformTypeOfArray = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if (isOneOfNode(value) || isAnyOfNode(value) || isAllOfNode(value)) {
    return value as JsonSchemaTransformedFragment
  }
  
  const types = 'type' in value && value.type ? (Array.isArray(value.type) ? value.type : [value.type]) : []
  let typeSet = new Set(types.filter(isValidType))


  if (!typeSet.size) {
    typeSet = new Set(inferTypes(value))
  }

  if (typeSet.size && "nullable" in value && value.nullable) {
    typeSet.add('null')
  }

  if (!typeSet.size) { return value as JsonSchemaTransformedFragment }

  if (typeSet.size === 1) {
    const [type] = [...typeSet.values()]
    return { 
      ...pick<any>(value, jsonSchemaTypeProps[type]), 
      type, 
    } as JsonSchemaTransformedFragment
  } else {
    return { anyOf: [...typeSet.values()].map((type) => ({ 
      ...pick<any>(value, jsonSchemaTypeProps[type]),
      type,
    })) } as JsonSchemaTransformedFragment
  }
}

export const transformDeprecated = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if ('x-deprecated' in value && typeof value['x-deprecated'] === 'boolean') {
    return { deprecated: value['x-deprecated'], ...value } as JsonSchemaTransformedFragment
  }

  return value as JsonSchemaTransformedFragment
}

export const transformTitle = (value: JsonSchemaFragment, ref?: string): JsonSchemaTransformedFragment => {
  if (!value || 'title' in value || !ref) {
    return value as JsonSchemaTransformedFragment
  }

  const key = parsePointer(ref).pop()!
  return { title: key[0].toUpperCase() + key.slice(1), ... value } as JsonSchemaTransformedFragment
}

export const transormers: JsonSchemaTransformFunc[] = [
  transformConst,
  transformExample,
  transformDeprecated,
  transformExclusiveMinimum,
  transformExclusiveMaximum,
  transformTypeOfArray,
  transformAdditionalItems,
  transformAdditionalProperties,
]
