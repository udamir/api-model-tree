import { isAnyOfNode, isOneOfNode } from "allof-merge"

import type { 
  ChangeMeta, ChangeType, IModelStateNode, IModelStatePropNode, IModelTree, 
  IModelTreeNode, ModelDataNode, ModelTreeNodeType, NodeChangesSummary 
} from "./types"
import { changeTypes } from "./consts"

export function isStringOrNumber(value: unknown): value is number | string {
  return typeof value === 'string' || typeof value === 'number'
}

export const isKey = <T extends object>(x: T, k: PropertyKey): k is keyof T => {
  return k in x;
}

export function isObject(maybeObj: unknown): maybeObj is Record<number | string | symbol, unknown> {
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

export function isAllOfNode(value: any): value is { allOf: any[] } {
  return value && value.allOf && Array.isArray(value.allOf)
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number"
}

export function getNodeComplexityType(value: any): ModelTreeNodeType {
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

export const objectKeys = <T extends object>(value: T): (keyof T)[] => {
  return Object.keys(value) as (keyof T)[]
}

export function pick<T extends object>(target: unknown, keys: readonly (keyof T)[]): Partial<T> {
  if (!isObject(target)) { return {} }
  const source: any = {}

  for (const key of keys) {
    if (!(key in target)) { continue }
    
    const value = target[key]
    if (Array.isArray(value)) {
      source[key] = [...value] as any
    } else if (typeof value === "object") {
      source[key] = {...value}
    } else {
      source[key] = value
    }
  }

  return source
}

export const isModelStatePropNode = (node: IModelStateNode<any>): node is IModelStatePropNode<any> => {
  return node.type === "basic" || node.type === "expandable"
}

export const getTargetNode = <T, K extends string, M>(tree: IModelTree<T, K, M>, node: ModelDataNode<T, K, M>): IModelTreeNode<T, K, M> | null => {
  if (typeof node === 'object' && node && 'ref' in node) {
    const _node = tree.nodes.get(node.ref)
    if (_node) {
      return getTargetNode(tree, _node)
    } else {
      return null
    }  
  }
  return node
}

export const calcChanges = (summary: Record<ChangeType, number>, changes?: Record<string, ChangeMeta>) => {
  Object.values(changes ?? {}).forEach(change => {
    if ("array" in change) { 
      calcChanges(summary, change.array)
    } else {
      summary[change.type] = (summary[change.type] ?? 0) + 1
    }
  })
}

export const sumChanges = (c1: NodeChangesSummary, c2?: NodeChangesSummary): NodeChangesSummary => {
  if (!c2) { return c1 }
  const summary: Partial<Record<ChangeType, number>> = {}
  for (const changeType of changeTypes) {
    if (!(changeType in c1) && !(changeType in c2)) { continue }
    summary[changeType] = (c1[changeType] ?? 0) + (c2[changeType] ?? 0)
  }
  return summary
}
