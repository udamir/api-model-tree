import type { JsonSchemaFragment, JsonSchemaNodeType } from './jsonSchema.types'
import { ANNOTATIONS, jsonSchemaNodeType } from './jsonSchema.consts'
import { isValidType } from './jsonSchema.guards'
import { isStringOrNumber } from '../utils'
import { pick } from '../utils/pick'

export const COMMON_VALIDATION_TYPES: string[] = ['readOnly', 'writeOnly', 'style']

const VALIDATION_TYPES: Partial<Record<JsonSchemaNodeType, (keyof JsonSchemaFragment)[]>> = {
  string: ['minLength', 'maxLength', 'pattern'],
  number: ['multipleOf', 'minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum'],
  get integer() { return this.number },
  object: ['additionalProperties', 'minProperties', 'maxProperties'],
  array: ['additionalItems', 'minItems', 'maxItems', 'uniqueItems'],
}

function getTypeValidations(types: JsonSchemaNodeType[]): (keyof JsonSchemaFragment)[] | null {
  let extraValidations: (keyof JsonSchemaFragment)[] | null = null

  for (const type of types) {
    const value = VALIDATION_TYPES[type]
    if (value !== void 0) {
      extraValidations ??= []
      extraValidations.push(...value)
    }
  }

  return extraValidations
}

export function getValidations(fragment: JsonSchemaFragment, types: JsonSchemaNodeType[] | null): Record<string, unknown> {
  const extraValidations = types === null ? null : getTypeValidations(types)
  const validationKeys = [...COMMON_VALIDATION_TYPES, ...extraValidations || []]
  const validations = pick(fragment, validationKeys)
  return validations
}

export function inferType(fragment: JsonSchemaFragment): JsonSchemaNodeType | null {
  if ('properties' in fragment || 'additionalProperties' in fragment || 'patternProperties' in fragment) {
    return jsonSchemaNodeType.Object
  }

  if ('items' in fragment || 'additionalItems' in fragment) {
    return jsonSchemaNodeType.Array
  }

  return null
}

export function unwrapStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function unwrapArrayOrNull(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null
}

export function getTypes(fragment: JsonSchemaFragment): JsonSchemaNodeType[] | null {
  const types: JsonSchemaNodeType[] = []
  let isNullable = false

  if ('nullable' in fragment) {
    if (fragment.nullable === true) {
      isNullable = true
    }
  }
  if ('type' in fragment) {
    if (Array.isArray(fragment.type)) {
      types.push(...fragment.type.filter(isValidType))
    } else if (isValidType(fragment.type)) {
      types.push(fragment.type)
    }
    if (isNullable && !types.includes(jsonSchemaNodeType.Null)) {
      types.push(jsonSchemaNodeType.Null)
    }
    return types
  }

  const inferredType = inferType(fragment)
  if (inferredType !== null) {
    types.push(inferredType)
    if (isNullable && !types.includes(jsonSchemaNodeType.Null)) {
      types.push(jsonSchemaNodeType.Null)
    }
    return types
  }

  return null
}

export function getRequired(required: unknown): string[] | null {
  if (!Array.isArray(required)) return null
  return required.filter(isStringOrNumber).map(String)
}

export function getPrimaryType(fragment: JsonSchemaFragment, types: JsonSchemaNodeType[] | null) {
  if (types !== null) {
    if (types.includes(jsonSchemaNodeType.Object)) {
      return jsonSchemaNodeType.Object
    }

    if (types.includes(jsonSchemaNodeType.Array)) {
      return jsonSchemaNodeType.Array
    }

    if (types.length > 0) {
      return types[0]
    }

    return null
  }

  return null
}

export function getAnnotations(fragment: JsonSchemaFragment) {
  const annotations = pick(fragment, ANNOTATIONS)
  if ('example' in fragment && !Array.isArray(annotations.examples)) {
    // example is more OAS-ish, but it's common enough to be worth supporting
    annotations.examples = [fragment.example]
  }

  return annotations
}
