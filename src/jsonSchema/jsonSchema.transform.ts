import { isAnyOfNode, isOneOfNode, isRefNode } from "allof-merge"

import type { JsonSchemaCrawlState } from "./jsonSchema.types"
import { isAllOfNode, isObject, objectKeys } from "../utils"
import { inferTypes, isValidType } from "./jsonSchema.utils"
import type { SchemaTransformFunc } from "../types"

export const validators = {
  type: (value: unknown) => (Array.isArray(value) && value.every(isValidType)) || isValidType(value),
  description: (value: unknown) => typeof value === "string",
  title: (value: unknown) => typeof value === "string",
  deprecated: (value: unknown) => typeof value === "boolean",
  readOnly: (value: unknown) => typeof value === "boolean",
  writeOnly: (value: unknown) => typeof value === "boolean",
  examples: (value: unknown) => Array.isArray(value),
  enum: (value: unknown) => Array.isArray(value),
  format: (value: unknown) => typeof value === "string",
  minLength: (value: unknown) => typeof value === "number",
  maxLength: (value: unknown) => typeof value === "number",
  pattern: (value: unknown) => typeof value === "string",
  multipleOf: (value: unknown) => typeof value === "number",
  minimum: (value: unknown) => typeof value === "number",
  exclusiveMinimum: (value: unknown) => typeof value === "number" || typeof value === "boolean",
  maximum: (value: unknown) => typeof value === "number",
  exclusiveMaximum: (value: unknown) => typeof value === "number" || typeof value === "boolean",
  properties: (value: unknown) => isObject(value) && Object.keys(value).length,
  required: (value: unknown) => Array.isArray(value),
  patternProperties: (value: unknown) => isObject(value) && Object.keys(value).length,
  additionalProperties: (value: unknown) =>
    typeof value === "boolean" || (isObject(value) && Object.keys(value).length),
  minProperties: (value: unknown) => typeof value === "number",
  maxProperties: (value: unknown) => typeof value === "number",
  propertyNames: (value: unknown) => typeof value === "object" && value !== null && Object.keys(value).length,
  items: (value: unknown) => Array.isArray(value) || (isObject(value) && Object.keys(value).length),
  additionalItems: (value: unknown) => isObject(value) && Object.keys(value).length,
  minItems: (value: unknown) => typeof value === "number",
  maxItems: (value: unknown) => typeof value === "number",
  uniqueItems: (value: unknown) => typeof value === "boolean",
}

export const transformAdditionalItems: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }

  const { aditionalItems, ...rest } = value as any
  // transform aditionalItems: true into aditionalItems with type: any
  if ("type" in value && value.type === "array" && aditionalItems === true) {
    return { ...value, aditionalItems: { type: "any" } }
  }

  // remove additionalItems: false
  if (!aditionalItems) {
    return rest
  }

  return value
}

export const transformAdditionalProperties: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }

  const { additionalProperties, ...rest } = value as any
  // transform additionalProperties: true into additionalProperties with type: any
  if ("type" in value && value.type === "object" && additionalProperties === true) {
    return { ...value, additionalProperties: { type: "any" } }
  }

  // remove additionalProperties: false
  if (!additionalProperties) {
    return rest
  }

  return value
}

export const transformDiscriminator: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // 1. convert discriminator to consts
  // 2. add custom tag to descriminator property

  if (("discriminator" in value && isOneOfNode(value)) || isAnyOfNode(value)) {
    const { discriminator, ...rest } = value

    if (
      typeof discriminator !== "object" ||
      !discriminator ||
      Array.isArray(discriminator) ||
      !("propertyName" in discriminator)
    ) {
      return rest
    }

    const prop = discriminator.propertyName
    const mapping: Record<string, string> = discriminator.mapping ?? {}
    const refs = Object.entries(mapping).reduce((res, [key, $ref]) => (res[$ref] = key), {} as any)

    const transformCombinary = (item: unknown) =>
      isRefNode(item) && item.$ref in refs
        ? { ...item, properties: { [prop]: { ...(item.properties ?? {}), const: refs[item.$ref] } } }
        : item

    if (isAnyOfNode(value)) {
      return { ...rest, anyOf: value.anyOf.map(transformCombinary) }
    } else if (isOneOfNode(value)) {
      return { ...rest, oneOf: value.oneOf.map(transformCombinary) }
    }
  }
  return value
}

export const transformConst: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // transform const into enum
  if ("const" in value) {
    const { const: v, ...rest } = value
    return { ...rest, enum: [v] }
  }
  return value
}

export const transformRequred: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // 1. remove not unique items
  // 2. remove non-string items
  if ("required" in value && Array.isArray(value.required)) {
    const required = value.required.filter(
      (item, index, array) => typeof item === "string" && array.indexOf(item) === index
    )

    return { ...value, required }
  }
  return value
}

export const transformExclusiveMinimum: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // 1. convert exclusiveMinimum from boolean to number
  // 2. remove minimum if exclusiveMinimum exists
  if ("exclusiveMinimum" in value && typeof value.exclusiveMinimum === "boolean" && "minimum" in value) {
    const { minimum, exclusiveMinimum, ...rest } = value
    return { ...rest, exclusiveMinimum: minimum }
  }
  return value
}

export const transformExclusiveMaximum: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // 1. convert exclusiveMaximum from boolean to number
  // 2. remove maximum if exclusiveMaximum exists
  if ("exclusiveMaximum" in value && typeof value.exclusiveMaximum === "boolean" && "maximum" in value) {
    const { maximum, exclusiveMaximum, ...rest } = value
    return { ...rest, exclusiveMaximum: maximum }
  }
  return value
}

export const transformExample: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // 1. convert example to array of examples
  if ("example" in value) {
    const { example, ...rest } = value
    const examples = "examples" in value && Array.isArray(value.examples) ? value.examples : []
    return { ...rest, examples: [...examples, example] }
  }
  return value
}

export const transformTypeOfArray: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // 1. remove non-standard types
  // 2. convert nullable into null type
  // 3. convert array of types into anyOf with single type
  // TODO: 4. set any type if it is undefined ?
  if (isOneOfNode(value) || isAnyOfNode(value) || isAllOfNode(value)) {
    return value
  }

  const types = "type" in value && value.type ? (Array.isArray(value.type) ? value.type : [value.type]) : []
  let typeSet = new Set(types.filter(isValidType))

  if (!typeSet.size) {
    typeSet = new Set(inferTypes(value))
  }

  if (typeSet.size && "nullable" in value && value.nullable) {
    typeSet.add("null")
  }

  if (!typeSet.size) {
    return value
  }

  if (typeSet.size === 1) {
    const [type] = [...typeSet.values()]
    return {
      // TODO: exclude not valid properties
      // ...pick<any>(value, jsonSchemaTypeProps[type]),
      ...value,
      type,
    }
  } else {
    const { defs, definitions, nullable, ...rest } = value as any
    return {
      anyOf: [...typeSet.values()].map((type) => ({
        // TODO: exclude not valid properties
        // ...pick<any>(rest, jsonSchemaTypeProps[type]),
        ...rest,
        type,
      })),
      ...defs ? { defs } : {},
      ...definitions ? { definitions } : {},
    }
  }
}

export const transformDeprecated: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value) {
    return value
  }
  // 1. convert "x-deprecated" into deprecated
  // TODO: 2. convert "x-deprecated-info" into deprecated object
  if ("x-deprecated" in value && typeof value["x-deprecated"] === "boolean") {
    return { deprecated: value["x-deprecated"], ...value }
  }

  return value
}

export const filterValidProps: SchemaTransformFunc<JsonSchemaCrawlState> = (value) => {
  if (typeof value !== "object" || !value || Array.isArray(value)) {
    return value
  }

  const result: any = { ...value }

  for (const prop of objectKeys(validators)) {
    if (prop in result) {
      const isValidProp = validators[prop]
      if (!isValidProp(result[prop])) {
        delete result[prop]
      }
    }
  }

  return result
}

export const jsonSchemaTransformers = [
  filterValidProps,
  transformAdditionalItems,
  transformAdditionalProperties,
  transformConst,
  transformDeprecated,
  transformDiscriminator,
  transformExample,
  transformExclusiveMaximum,
  transformExclusiveMinimum,
  transformRequred,
  transformTypeOfArray,
]
