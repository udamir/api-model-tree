import { parsePointer } from "allof-merge"

import type {
  JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta,
  JsonSchemaNodeType, JsonSchemaTreeNode,
} from "./jsonSchema.types"
import { jsonSchemaCommonProps, jsonSchemaNodeTypes, jsonSchemaTypeProps } from "./jsonSchema.consts"
import { modelTreeNodeType } from "../consts"
import type { ModelDataNode } from "../types"
import { isStringOrNumber } from "../utils"

export const isRequired = (key: string | number, parent: ModelDataNode<any, any, any> | null): boolean => {
  if (!parent || typeof key === "number" || !key) {
    return false
  }
  const value = parent?.value()
  return !!value && "required" in value && Array.isArray(value.required) && value.required.includes(key)
}

export const isValidType = (maybeType: unknown): maybeType is JsonSchemaNodeType =>
  typeof maybeType === "string" && jsonSchemaNodeTypes.includes(maybeType as JsonSchemaNodeType)

export function inferTypes(fragment: unknown): JsonSchemaNodeType[] {
  if (typeof fragment !== 'object' || !fragment) { return [] }

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
  return typeof value === "string" ? value : null
}

export function unwrapArrayOrNull(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null
}

export function getRequired(required: unknown): string[] | null {
  if (!Array.isArray(required)) return null
  return required.filter(isStringOrNumber).map(String)
}

export const isJsonSchemaTreeNode = (
  node?: ModelDataNode<JsonSchemaNodeValue<any>, JsonSchemaNodeKind, JsonSchemaNodeMeta>
): node is JsonSchemaTreeNode<any> => {
  return !!node && node.type === modelTreeNodeType.simple
}

export const isJsonSchemaComplexNode = (
  node?: ModelDataNode<JsonSchemaNodeValue<any>, JsonSchemaNodeKind, JsonSchemaNodeMeta>
): node is JsonSchemaTreeNode<any> => {
  return !!node && node.type !== modelTreeNodeType.simple
}

export const transformTitle = (value: unknown, ref?: string): unknown => {
  // 1. transform $ref key into title
  if (!value || typeof value !== "object" || "title" in value || !ref) {
    return value
  }

  const key = parsePointer(ref).pop()!
  return { title: key[0].toUpperCase() + key.slice(1), ...value }
}
