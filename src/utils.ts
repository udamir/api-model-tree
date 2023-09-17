import { isAnyOfNode, isOneOfNode } from "allof-merge"

import { ModelDataNodeType } from "./types"

export function isStringOrNumber(value: unknown): value is number | string {
  return typeof value === 'string' || typeof value === 'number'
}

export function isObject(maybeObj: unknown): maybeObj is object {
  return maybeObj !== void 0 && maybeObj !== null && typeof maybeObj === 'object'
}

export function isPrimitive(
  maybePrimitive: unknown,
): maybePrimitive is string | number | boolean | undefined | null | symbol | bigint {
  return typeof maybePrimitive !== 'function' && !isObject(maybePrimitive)
}

export function isObjectLiteral(maybeObj: unknown): maybeObj is Record<string, unknown> {
  if (isPrimitive(maybeObj) === true) return false
  const proto = Object.getPrototypeOf(maybeObj)
  return proto === null || proto === Object.prototype
}

export function isNonNullable<T = unknown>(maybeNullable: T): maybeNullable is NonNullable<T> {
  return maybeNullable !== void 0 && maybeNullable !== null
}

export function isAllOfNode(value: any) {
  return value && value.allOf && Array.isArray(value.allOf)
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number"
}

export function getNodeComplexityType(value: any): ModelDataNodeType {
  if (isAllOfNode(value)) {
    return "allOf"
  }
  if (isOneOfNode(value)) {
    return "oneOf"
  }
  if (isAnyOfNode(value)) {
    return "anyOf"
  }
  return "simple"
}

export const keys = <T extends object>(value: T): (keyof T)[] => {
  return Object.keys(value) as (keyof T)[]
}

export function pick<T extends object>(target: any, keys: readonly (keyof T)[]): Partial<T> {
  const source: Partial<T> = {}

  for (const key of keys) {
    if (key in target) {
      source[key] = target[key]
    }
  }

  return source
}
