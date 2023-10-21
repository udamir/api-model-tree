import { buildPointer, isRefNode, parseRef, resolveRefNode } from "allof-merge"
import { SyncCrawlHook, syncCrawl } from "json-crawl"
import type { Diff } from 'api-smart-diff'

import {
  JsonSchemaNodeValue, JsonSchemaNode, JsonSchemaFragment, JsonSchemaNodeKind,
  JsonSchemaModelTree, JsonSchemaNodeMeta, JsonSchemaNodeType,
} from "./jsonSchema.types"
import { jsonSchemaNodeKinds, jsonSchemaNodeMetaProps, jsonSchemaNodeValueProps } from "./jsonSchema.consts"
import { isValidType, transformTitle, isJsonSchemaTreeNode, isRequired } from "./jsonSchema.utils"
import { getNodeComplexityType, getTargetNode, isObject, objectKeys, pick } from "../utils"
import { CreateNodeResult, ModelDataNode } from "../types"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { modelTreeNodeType } from "../consts"
import { ModelTree, ModelTreeComplexNode } from "../modelTree"

export type JsonSchemaDiffTreeNode<T extends JsonSchemaNodeType = any> = ModelDataNode<
  JsonSchemaDiffNodeValue<T>,
  JsonSchemaNodeKind,
  JsonSchemaDiffNodeMeta
>
export type JsonSchemaComplexNode<T extends JsonSchemaNodeType = any> = ModelTreeComplexNode<
  JsonSchemaDiffNodeValue<T>,
  JsonSchemaNodeKind,
  JsonSchemaDiffNodeMeta
>

export type JsonSchemaDiffCrawlState = { 
  parent: JsonSchemaDiffTreeNode | null
  container?: JsonSchemaComplexNode
  source?: any
  metaKey: symbol
}

export type JsonSchemaDiffNodeValue<T extends JsonSchemaNodeType = any> = JsonSchemaNodeValue<T> & { $changes?: any }
export type JsonSchemaDiffNodeMeta = JsonSchemaNodeMeta & { 
  $nodeChanges?: any,
  $metaChanges?: any,
  $childrenChanges?: any,
  $nestedChanges?: any
}

export const getRequiredChange = (key: string | number, parent: ModelDataNode<any, any, any> | null): Diff | null => {
  if (!parent || typeof key === "number" || !key) {
    return null
  }
  const value = parent?.value()
  const diff = value.$changes
  if (!!diff && 'required' in diff && !!value && 'required' in value && Array.isArray(value.required) && value.required.includes(key)) {
    if (diff.required.array) {
      const index = value.required.indexOf(key)
      if (index in diff.required.array) {
        return diff.required.array[index]
      }
    } else {
      return diff.required
    }
  }
  return null
}

export const getChildrenChanges = (id: string, _fragment: any, metaKey: symbol): Record<string, Diff> => {
  const children: Record<string, Diff> = {}

  // add/remove all properties
  if (_fragment?.[metaKey]?.properties) {
    for (const prop of objectKeys(_fragment.properties as object)) {
      children[`${id}/properties/${prop}`] = _fragment?.[metaKey]?.properties
    }
  }

  // add/remove some of properties
  const properties: Record<string, any> = _fragment.properties?.[metaKey] ?? {}
  for (const prop of objectKeys(properties)) {
    children[`${id}/properties/${prop}`] = properties[prop]
  }

  // add/remove additionalProperties
  if (_fragment?.[metaKey]?.additionalProperties) {
    children[`${id}/additionalProperties`] = _fragment[metaKey].additionalProperties
  }

  // add/remove items
  if (_fragment?.[metaKey]?.items) {
    const items: Record<string, any> = _fragment?.[metaKey]?.items.array
    if (items) {
      for (const item of objectKeys(items)) {
        children[`${id}/items/${item}`] = items[item]
      }
    } else if (Array.isArray(_fragment.items)) {
      for (const item of _fragment.items.keys()) {
        children[`${id}/items/${item}`] = _fragment[metaKey].items
      }
    } else {
      children[`${id}/items`] = _fragment[metaKey].items
    }
  }
  
  if (_fragment?.[metaKey]?.additionalItems) {
    children[`${id}/additionalItems`] = _fragment[metaKey].additionalItems
  }

  // add/remove all patternProperties
  if (_fragment?.[metaKey]?.patternProperties) {
    for (const prop of objectKeys(_fragment.patternProperties as object)) {
      children[`${id}/patternProperties${buildPointer([prop])}`] = _fragment?.[metaKey]?.patternProperties
    }
  }

  const patternProperties: Record<string, any> = _fragment?.patternProperties?.[metaKey] ?? {}
  for (const prop of objectKeys(patternProperties)) {
    children[`${id}/patternProperties${buildPointer([prop])}`] = patternProperties[prop]
  }

  return children
}

export const simpleDiffMeta = (id: string, key: string | number, _fragment: any, state: JsonSchemaDiffCrawlState) => {
  const { metaKey, parent = null, container = null } = state
  const requiredChange = getRequiredChange(key, parent)
  const $metaChanges = {
    ...requiredChange ? { required: requiredChange } : {},
    ...pick(_fragment?.[metaKey], jsonSchemaNodeMetaProps),
  }
  const $childrenChanges = getChildrenChanges(id, _fragment ?? {}, metaKey)
  const $nodeChanges = parent?.meta?.$childrenChanges?.[id] || container?.meta?.$nestedChanges?.[id]

  return {
    ...pick<any>(_fragment, jsonSchemaNodeMetaProps),
    ...$nodeChanges ? { $nodeChanges } : {},
    ...Object.keys($metaChanges).length ? { $metaChanges } : {},
    ...Object.keys($childrenChanges).length ? { $childrenChanges } : {},
    _fragment,
  }
}

export const nestedDiffMeta = (id: string, _fragment: any, metaKey: symbol, meta: JsonSchemaDiffNodeMeta = {}) => {
  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    let _meta = meta
    for (const item of _fragment[complexityType]!) {
      _meta = nestedDiffMeta(`${id}/${complexityType}/${item}`, item as JsonSchemaFragment, metaKey, _meta)
    }

    const nestedChanges: Record<string, any> = _fragment?.[metaKey]?.[complexityType]?.array ?? {}

    const $nestedChanges: Record<string, Diff> = {}
    for (const nested of objectKeys(nestedChanges)) {
      $nestedChanges[`${id}/${complexityType}/${nested}`] = nestedChanges[nested]
    }

    return { 
      ..._meta,  
      ...Object.keys($nestedChanges).length ? { $nestedChanges } : {}
    }
  } else {
    return { ...pick<any>(_fragment, jsonSchemaNodeMetaProps), ...meta }
  }
}

export const createJsonSchemaDiffNode = (
  tree: ModelTree<JsonSchemaDiffNodeValue, JsonSchemaNodeKind, JsonSchemaDiffNodeMeta>,
  id: string,
  kind: JsonSchemaNodeKind,
  key: string | number,
  _fragment: any | null,
  state: JsonSchemaDiffCrawlState
): CreateNodeResult<JsonSchemaNode> => {
  const { metaKey, source, parent = null } = state
  const required = isRequired(key, parent)

  if (_fragment === null) {
    return { node: tree.createNode(id, kind, key, { parent, meta: { required } }), value: null }
  }

  let res: any = { value: _fragment, node: null }

  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    const params = { type: complexityType, parent, meta: { ...nestedDiffMeta(id, _fragment, metaKey), required, _fragment } }
    res.node = tree.createComplexNode(id, kind, key, params)
  } else if (isRefNode(_fragment)) {
    const { normalized } = parseRef(_fragment.$ref)
    if (tree.nodes.has(normalized)) {
      res.value = null
      res.node = tree.nodes.get(normalized)!
    } else {
      // resolve and create node in cache
      const _value = transformTitle(resolveRefNode(source, _fragment), normalized) ?? null
      if (_value === null) {
        res = { node: tree.createNode(id, kind, key, { parent, meta: { required, _fragment } }), value: null }
      } else {
        res = createJsonSchemaDiffNode(tree, normalized, "definition", "", _value, state)
      }
    }

    const meta = { ...simpleDiffMeta(id, key, res.value, state), required }
    const params = { parent, meta }
    res.node = tree.createRefNode(id, kind, key, res.node ?? null, params)
  } else {
    const { type = "any" } = _fragment
    if (Array.isArray(type) || !type || typeof type !== "string" || !isValidType(type)) {
      throw new Error(`Schema should have type: ${id}`)
    }

    const meta = { ...simpleDiffMeta(id, key, _fragment, state), required }
    const valueChanges = pick(_fragment[metaKey], jsonSchemaNodeValueProps[type])

    const value = {
      ...pick<any>(_fragment, jsonSchemaNodeValueProps[type]),
      ...Object.keys(valueChanges).length ? { $changes: valueChanges } : {}
    } as JsonSchemaDiffNodeValue

    res.node = tree.createNode(id, kind, key, { value, meta, parent })
  }

  return res
}

export const createJsonSchemaDiffTreeCrawlHook = (tree: JsonSchemaModelTree): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) {
      return null
    }
    if (!jsonSchemaNodeKinds.includes(ctx.rules?.kind) || Array.isArray(value)) {
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, container, source } = ctx.state
    const { kind } = ctx.rules

    const res = createJsonSchemaDiffNode(tree, id, kind, ctx.key, value as JsonSchemaFragment, ctx.state)

    if (container) {
      container.addNestedNode(res.node)
    } else {
      parent?.addChild(res.node)
    }

    if (res.value) {
      const _node = getTargetNode(tree, res.node)
      const state = isJsonSchemaTreeNode(res.node) 
        ? { ...ctx.state, parent: _node, container: null } 
        : { ...ctx.state, parent, container: _node }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}

// export const createJsonSchemaDiffTree = (before: JsonSchemaFragment, after: JsonSchemaFragment, beforeSource: any = before, afterSource: any = after) => {
export const createJsonSchemaDiffTree = (merged: any, metaKey: symbol, mergedSource: any = merged) => {

  const tree = new ModelTree<JsonSchemaDiffNodeValue, JsonSchemaNodeKind, JsonSchemaDiffNodeMeta>()
  if (!isObject(merged) || !isObject(mergedSource)) {
    return tree
  }

  // const _before = merge(before, { source: beforeSource, mergeRefSibling: true, mergeCombinarySibling: true })
  // const _after = merge(after, { source: afterSource, mergeRefSibling: true, mergeCombinarySibling: true })

  // const b = syncClone(_before, transformCrawlHook, { rules: jsonSchemaCrawlRules() })
  // const a = syncClone(_after, transformCrawlHook, { rules: jsonSchemaCrawlRules() })

  // const merged = apiMerge(b, a, { metaKey })

  // const crawlState: JsonSchemaCrawlState = { parent: null, source: merged }
  const crawlState: JsonSchemaDiffCrawlState = { parent: null, source: mergedSource, metaKey }

  syncCrawl(merged, [
    createJsonSchemaDiffTreeCrawlHook(tree)
  ], { state: crawlState, rules: jsonSchemaCrawlRules() })

  return tree
}
