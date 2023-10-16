import { buildPointer, isRefNode, parseRef, resolveRefNode } from "allof-merge"
import { CrawlContext, CrawlHookResponse, SyncCrawlHook } from 'json-crawl'

import { 
  JsonSchemaCrawlState, JsonSchemaNodeValue, JsonSchemaNode, 
  JsonSchemaTreeNode, JsonSchemaFragment, JsonSchemaNodeKind, JsonSchemaComplexNode, JsonSchemaModelTree, JsonSchemaNodeMeta, JsonSchemaCrawlRule 
} from "./jsonSchema.types"
import { jsonSchemaNodeKind, jsonSchemaNodeKinds, jsonSchemaNodeMetaProps, jsonSchemaNodeValueProps } from "./jsonSchema.consts"
import { isValidType, transformTitle, isJsonSchemaTreeNode, isRequired } from "./jsonSchema.utils"
import { getNodeComplexityType, pick } from "../utils"
import { modelTreeNodeType } from "../consts"
import { ModelDataNode } from "../types"
import { ModelTree } from "../modelTree"

export const nestedMeta = (_fragment: JsonSchemaFragment, meta: JsonSchemaNodeMeta = {}) => {
  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    let _meta = meta
    for (const item of _fragment[complexityType]!) {
      _meta = nestedMeta(item as JsonSchemaFragment, _meta)
    }
    return _meta
  } else {
    return { ...pick<any>(_fragment, jsonSchemaNodeMetaProps), ...meta}
  }
}

export const createJsonSchemaNode = (
  tree: ModelTree<JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta>,
  id: string,
  kind: JsonSchemaNodeKind,
  key: string | number,
  _fragment: JsonSchemaFragment | null, 
  parent: JsonSchemaTreeNode | null = null
): JsonSchemaNode => {
  const required = isRequired(key, parent)

  if (_fragment === null) {
    return tree.createNode(id, kind, key, { parent, meta: { required }})
  }
  
  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    return tree.createComplexNode(id, kind, key, { type: complexityType, parent, meta: { ...nestedMeta(_fragment), required, _fragment } })
  } else {
    const { type = "any" } = _fragment
    if (Array.isArray(type) || !type || typeof type !== 'string' || !isValidType(type)) { 
      throw new Error (`Schema should have type: ${id}`)
    }

    const meta = { 
      ...pick<any>(_fragment, jsonSchemaNodeMetaProps),
      required,
      _fragment
    } as JsonSchemaNodeMeta
    
    const value = pick<any>(_fragment, jsonSchemaNodeValueProps[type]) as JsonSchemaNodeValue

    return tree.createNode(id, kind, key, { value, meta, parent })
  }
}

export const crawlJsonSchemaRefNode = (tree: JsonSchemaModelTree, $ref: any, ctx: CrawlContext<JsonSchemaCrawlState, JsonSchemaCrawlRule>): CrawlHookResponse<any> | null => {
  if (!ctx.rules || !("kind" in ctx.rules)) { return null }
  const id = "#" + buildPointer(ctx.path)
  const { parent, container, source } = ctx.state
  const { kind } = ctx.rules

  let refData = null
  // check if node in cache
  let node: ModelDataNode<JsonSchemaNodeValue<any>, JsonSchemaNodeKind, JsonSchemaNodeMeta> | undefined
  if (tree.nodes.has($ref)) {
    node = tree.nodes.get($ref)!
  } else {
    // resolve and create node in cache
    refData = resolveRefNode(source, { $ref })
    const { normalized } = parseRef($ref)
    const _value = refData ? transformTitle(refData, normalized) : null
    node = createJsonSchemaNode(tree, normalized, jsonSchemaNodeKind.definition, "", _value)
  }

  if (container) {
    const params = { parent: container.parent, meta: { required: isRequired(ctx.key, container.parent) }}
    const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, params)
    container.addNestedNode(refNode)
  } else if (parent) {
    const params = { parent, meta: { required: isRequired(ctx.key, parent) }}
    const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, params)
    parent.addChild(refNode)
  }
    
  if (refData && node) {
    const state = isJsonSchemaTreeNode(node) ? { parent: node, source } : { parent, container: node as JsonSchemaComplexNode<any>, source }
    return { value: refData, state }
  } else {
    return null
  }
}

export const createJsonSchemaTreeCrawlHook = (tree: JsonSchemaModelTree): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!(jsonSchemaNodeKinds.includes(ctx.rules?.kind)) || Array.isArray(value)) { 
      return { value, state: ctx.state }
    }

    if (isRefNode(value)) {
      return crawlJsonSchemaRefNode(tree, value.$ref, ctx)
    } 

    const id = "#" + buildPointer(ctx.path)
    const { parent, container, source } = ctx.state
    const { kind } = ctx.rules
      
    const node = createJsonSchemaNode(tree, id, kind, ctx.key, value as JsonSchemaFragment, parent)
    
    if (container) {
      container.addNestedNode(node)
    } else {
      parent?.addChild(node)
    }
    const state = isJsonSchemaTreeNode(node) ? { parent: node, source } : { parent, container: node as JsonSchemaComplexNode<any>, source }
    return { value, state }
  }
}
