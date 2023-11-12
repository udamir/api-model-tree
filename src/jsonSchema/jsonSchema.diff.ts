import { buildPointer } from "allof-merge"
import { syncCrawl } from "json-crawl"

import {
  JsonSchemaNodeValue, JsonSchemaNodeKind,
  JsonSchemaNodeMeta, JsonSchemaNodeType, JsonSchemaCreateNodeParams,
} from "./jsonSchema.types"
import { ApiMergedMeta, ChangeMeta, ChangeType, DiffNodeMeta, DiffNodeValue, ModelDataNode, ModelTreeNodeParams, ModelTreeNodeType } from "../types"
import { calcChanges, getNodeComplexityType, isObject, objectKeys, pick, sumChanges } from "../utils"
import { jsonSchemaNodeMetaProps, jsonSchemaNodeValueProps } from "./jsonSchema.consts"
import { createJsonSchemaTreeCrawlHook } from "./jsonSchema.build"
import { isValidType, isRequired } from "./jsonSchema.utils"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { JsonSchemaModelTree } from "./jsonSchema.tree"
import { ModelTreeComplexNode } from "../modelTree"

export type JsonSchemaDiffTreeNode<T extends JsonSchemaNodeType = any> = ModelDataNode<
  JsonSchemaDiffNodeValue<T>,
  JsonSchemaNodeKind,
  JsonSchemaDiffNodeMeta
>
export type JsonSchemaComplexDiffNode<T extends JsonSchemaNodeType = any> = ModelTreeComplexNode<
  JsonSchemaDiffNodeValue<T>,
  JsonSchemaNodeKind,
  JsonSchemaDiffNodeMeta
>

export type JsonSchemaDiffCrawlState = { 
  parent: JsonSchemaDiffTreeNode | null
  container?: JsonSchemaComplexDiffNode
}

export type JsonSchemaDiffNodeValue<T extends JsonSchemaNodeType = any> = JsonSchemaNodeValue<T> & DiffNodeValue
export type JsonSchemaDiffNodeMeta = JsonSchemaNodeMeta & DiffNodeMeta

export class JsonSchemaModelDiffTree<
  T extends DiffNodeValue = JsonSchemaDiffNodeValue,
  K extends string = JsonSchemaNodeKind,
  M extends DiffNodeMeta = JsonSchemaDiffNodeMeta
> extends JsonSchemaModelTree<T, K, M> {

  constructor(source: unknown, public metaKey: symbol) {
    super(source)
  }

  public changesSummary(node: ModelDataNode<T, K, M>): Partial<Record<ChangeType, number>> {
    let summary = {} as Record<ChangeType, number>

    calcChanges(summary, node.meta.$metaChanges)
    calcChanges(summary, node.meta.$childrenChanges)
    calcChanges(summary, node.meta.$nestedChanges)
    
    if (node.type === "simple") {
      // skip required changes
      const { required, ...rest } = node.value()?.$changes ?? {}
      calcChanges(summary, rest)
    }

    return summary
  }

  public totalChangesSummary(node: ModelDataNode<T, K, M>): Partial<Record<ChangeType, number>> {
    if ("isCycle" in node && node.isCycle) { return {} }

    const nodeChanges = this.changesSummary(node)
    if (node.type === "simple") {
      return node.children().reduce((res, cur) => sumChanges(res, cur.meta.$nodeChangesSummary?.()), nodeChanges)
    } else {
      return node.nested.reduce((res, cur) => sumChanges(res, cur.meta.$nodeChangesSummary?.()), nodeChanges)
    }
  }

  public createNode(id: string, kind: K, key: string | number, params: ModelTreeNodeParams<T, K, M>) {
    const node = super.createNode(id, kind, key, params)
    // calucate $nodeChangesSummay
    node.meta.$nodeChangesSummary = () => this.totalChangesSummary(node)
    return node
  }

  public createComplexNode(id: string, kind: K, key: string | number, params: ModelTreeNodeParams<T, K, M> & { type: Exclude<ModelTreeNodeType, "simple"> }) {
    const node = super.createComplexNode(id, kind, key, params)
    // calucate $nodeChangesSummay
    node.meta.$nodeChangesSummary = () => this.totalChangesSummary(node)
    return node
  }

  public createNodeMeta (params: JsonSchemaCreateNodeParams<T, K, M>): M {
    const { value } = params
    
    const complexityType = getNodeComplexityType(value)
    if (complexityType === "simple") {
      return this.simpleDiffMeta(params) as M
    } else {
      return this.nestedDiffMeta(params) as M
    }
  } 

  protected getNodeChange = (params: JsonSchemaCreateNodeParams<T, K, M>) => {
    const { id, parent = null, container = null } = params
    const inheretedChanges = container?.meta?.$nodeChange ?? parent?.meta.$nodeChange
    const nodeChanges = parent?.meta?.$childrenChanges?.[id] || container?.meta?.$nestedChanges?.[id]
  
    return ['add', 'remove'].includes(inheretedChanges?.action ?? "") ? inheretedChanges : nodeChanges 
        ? { ...nodeChanges, depth: (parent?.depth ?? 0) + 1 } : undefined
  }

  public createNodeValue(params: JsonSchemaCreateNodeParams<T, K, M>): T {
    const { value } = params
    const { type = "any" } = value
    if (Array.isArray(type) || !type || typeof type !== "string" || !isValidType(type)) {
      throw new Error(`Schema should have correct type!`)
    }
    const valueChanges = pick(value[this.metaKey], jsonSchemaNodeValueProps[type])

    const _value = {
      ...pick<any>(value, jsonSchemaNodeValueProps[type]),
      ...Object.keys(valueChanges).length ? { $changes: valueChanges } : {}
    } as T

    return _value
  }

  public getRequiredChange (key: string | number, parent: ModelDataNode<any, any, any> | null): ChangeMeta | null {
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
  
  public getChildrenChanges (id: string, _fragment: any): Record<string, ApiMergedMeta> {
    const children: Record<string, ApiMergedMeta> = {}
  
    // add/remove all properties
    if (_fragment?.[this.metaKey]?.properties) {
      for (const prop of objectKeys(_fragment.properties as object)) {
        children[`${id}/properties/${prop}`] = _fragment?.[this.metaKey]?.properties
      }
    }
  
    // add/remove some of properties
    const properties: Record<string, any> = _fragment.properties?.[this.metaKey] ?? {}
    for (const prop of objectKeys(properties)) {
      children[`${id}/properties/${prop}`] = properties[prop]
    }
  
    // add/remove additionalProperties
    if (_fragment?.[this.metaKey]?.additionalProperties) {
      children[`${id}/additionalProperties`] = _fragment[this.metaKey].additionalProperties
    }
  
    // add/remove items
    if (_fragment?.[this.metaKey]?.items) {
      const items: Record<string, any> = _fragment?.[this.metaKey]?.items.array
      if (items) {
        for (const item of objectKeys(items)) {
          children[`${id}/items/${item}`] = items[item]
        }
      } else if (Array.isArray(_fragment.items)) {
        for (const item of _fragment.items.keys()) {
          children[`${id}/items/${item}`] = _fragment[this.metaKey].items
        }
      } else {
        children[`${id}/items`] = _fragment[this.metaKey].items
      }
    }
    
    if (_fragment?.[this.metaKey]?.additionalItems) {
      children[`${id}/additionalItems`] = _fragment[this.metaKey].additionalItems
    }
  
    // add/remove all patternProperties
    if (_fragment?.[this.metaKey]?.patternProperties) {
      for (const prop of objectKeys(_fragment.patternProperties as object)) {
        children[`${id}/patternProperties${buildPointer([prop])}`] = _fragment?.[this.metaKey]?.patternProperties
      }
    }
  
    const patternProperties: Record<string, any> = _fragment?.patternProperties?.[this.metaKey] ?? {}
    for (const prop of objectKeys(patternProperties)) {
      children[`${id}/patternProperties${buildPointer([prop])}`] = patternProperties[prop]
    }
  
    return children
  }
  
  public simpleDiffMeta (params: JsonSchemaCreateNodeParams<T, K, M>): JsonSchemaDiffNodeMeta {
    const { value, id, key = "", parent = null } = params

    const requiredChange = this.getRequiredChange(key, parent)
    const $metaChanges = {
      ...requiredChange ? { required: requiredChange } : {},
      ...pick(value?.[this.metaKey], jsonSchemaNodeMetaProps),
    }
    const $childrenChanges = this.getChildrenChanges(id, value ?? {})
    const $nodeChange = this.getNodeChange(params)
    
    return {
      ...pick<any>(value, jsonSchemaNodeMetaProps),
      ...$nodeChange ? { $nodeChange } : {},
      ...Object.keys($metaChanges).length ? { $metaChanges } : {},
      ...Object.keys($childrenChanges).length ? { $childrenChanges } : {},
      $nodeChangesSummary: () => ({}),
      required: isRequired(key, parent),
      _fragment: value,
    }
  }
  
  public nestedDiffMeta (params: JsonSchemaCreateNodeParams<T, K, M>): JsonSchemaDiffNodeMeta {
    const { value, id, key = "", parent = null } = params

    const complexityType = getNodeComplexityType(value)
    const nestedChanges: Record<string, any> = value?.[this.metaKey]?.[complexityType]?.array ?? {}
    const $nodeChange = this.getNodeChange(params)

    const $nestedChanges: Record<string, ApiMergedMeta> = {}
    for (const nested of objectKeys(nestedChanges)) {
      $nestedChanges[`${id}/${complexityType}/${nested}`] = nestedChanges[nested]
    }

    return { 
      ...Object.keys($nestedChanges).length ? { $nestedChanges } : {},
      ...$nodeChange ? { $nodeChange } : {},
      $nodeChangesSummary: () => ({}),
      required: isRequired(key, parent),
      _fragment: value
    }
  }
}

// export const createJsonSchemaDiffTree = (before: JsonSchemaFragment, after: JsonSchemaFragment, beforeSource: any = before, afterSource: any = after) => {
export const createJsonSchemaDiffTree = (merged: any, metaKey: symbol, mergedSource: any = merged) => {

  const tree = new JsonSchemaModelDiffTree(mergedSource, metaKey)
  if (!isObject(merged) || !isObject(mergedSource)) {
    return tree
  }

  // const _before = merge(before, { source: beforeSource, mergeRefSibling: true, mergeCombinarySibling: true })
  // const _after = merge(after, { source: afterSource, mergeRefSibling: true, mergeCombinarySibling: true })

  // const b = syncClone(_before, transformCrawlHook, { rules: jsonSchemaCrawlRules() })
  // const a = syncClone(_after, transformCrawlHook, { rules: jsonSchemaCrawlRules() })

  // const merged = apiMerge(b, a, { metaKey })

  // const crawlState: JsonSchemaCrawlState = { parent: null, source: merged }
  const crawlState: JsonSchemaDiffCrawlState = { parent: null }

  syncCrawl(merged, [
    createJsonSchemaTreeCrawlHook(tree)
  ], { state: crawlState, rules: jsonSchemaCrawlRules() })

  return tree
}
