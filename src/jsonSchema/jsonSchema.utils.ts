import { isAnyOfNode, isOneOfNode, parsePointer } from 'allof-merge'

import type { 
  JsonSchemaFragment, JsonSchemaNodeData, JsonSchemaNodeKind, JsonSchemaNodeType, 
  JsonSchemaTransformFunc, JsonSchemaTransformedFragment, JsonSchemaTreeNode 
} from './jsonSchema.types'
import { jsonSchemaCommonProps, jsonSchemaTypeProps, jsonSchemaNodeTypes } from './jsonSchema.consts'
import { isAllOfNode, isStringOrNumber, keys, pick } from '../utils'
import { validators } from './jsonSchema.validators'
import { modelTreeNodeType } from '../consts'
import { IModelTreeNode } from '../types'

export const isRequired = (key: string | number, parent: IModelTreeNode<any, any> | null): boolean => {
  if (!parent || typeof key === "number" || !key) { return false }
  const value = parent?.value()
  return !!value && ("required" in value) && Array.isArray(value.required) && value.required.includes(key)
}

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

export const transformRequred = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if ('required' in value && Array.isArray(value.required)) {
    const required = value.required.filter((item, index, array) => typeof item === 'string' && array.indexOf(item) === index)

    return { ...value, required } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export const transformExclusiveMinimum = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if ('exclusiveMinimum' in value && typeof value.exclusiveMinimum === 'boolean' && 'minimum' in value) {
    const { minimum, exclusiveMinimum, ...rest } = value
    return { ...rest, exclusiveMinimum: minimum } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export const transformExclusiveMaximum = (value: JsonSchemaFragment): JsonSchemaTransformedFragment => {
  if ('exclusiveMaximum' in value && typeof value.exclusiveMaximum === 'boolean' && 'maximum' in value) {
    const { maximum, exclusiveMaximum, ...rest } = value
    return { ...rest, exclusiveMaximum: maximum } as JsonSchemaTransformedFragment
  }
  return value as JsonSchemaTransformedFragment
}

export function transformExample(value: JsonSchemaFragment): JsonSchemaTransformedFragment {
  if ('example' in value) {
    const { example, ...rest } = value
    return { ...rest, examples: [...value.examples || [], example] } as JsonSchemaTransformedFragment
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

export const isJsonSchemaTreeNode = (node?: IModelTreeNode<JsonSchemaNodeData<any>, JsonSchemaNodeKind>): node is JsonSchemaTreeNode<any> => {
  return !!node && node.type === modelTreeNodeType.simple
}

export const isJsonSchemaComplexNode = (node?: IModelTreeNode<JsonSchemaNodeData<any>, JsonSchemaNodeKind>): node is JsonSchemaTreeNode<any> => {
  return !!node && node.type !== modelTreeNodeType.simple
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

export const filterValidProps = (value: JsonSchemaFragment<any>): JsonSchemaTransformedFragment => {
  const result = { ...value }

  for (const prop of keys(validators)) {
    if (prop in result) {
      const isValidProp = validators[prop]
      if (!isValidProp(result[prop])) {
        delete result[prop]
      }
    }
  }

  return result
}

export const jsonSchemaTransormers: JsonSchemaTransformFunc[] = [
  filterValidProps,
  transformRequred,
  transformConst,
  transformExample,
  transformDeprecated,
  transformExclusiveMinimum,
  transformExclusiveMaximum,
  transformTypeOfArray,
  transformAdditionalItems,
  transformAdditionalProperties,
]
