import { buildPointer, isRefNode, parseRef, resolveRefNode } from "allof-merge"
import { SyncCrawlHook } from "json-crawl"

import {
  JsonSchemaNodeValue, JsonSchemaNode, JsonSchemaTreeNode, JsonSchemaFragment,
  JsonSchemaNodeKind, JsonSchemaModelTree, JsonSchemaNodeMeta,
} from "./jsonSchema.types"
import { jsonSchemaNodeKinds, jsonSchemaNodeMetaProps, jsonSchemaNodeValueProps } from "./jsonSchema.consts"
import { isValidType, transformTitle, isJsonSchemaTreeNode, isRequired } from "./jsonSchema.utils"
import { getNodeComplexityType, getTargetNode, pick } from "../utils"
import { modelTreeNodeType } from "../consts"
import { ModelTree } from "../modelTree"
import { CreateNodeResult } from "../types"

export const nestedMeta = (_fragment: JsonSchemaFragment, meta: JsonSchemaNodeMeta = {}) => {
  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    let _meta = meta
    for (const item of _fragment[complexityType]!) {
      _meta = nestedMeta(item as JsonSchemaFragment, _meta)
    }
    return _meta
  } else {
    return { ...pick<any>(_fragment, jsonSchemaNodeMetaProps), ...meta }
  }
}

export const createJsonSchemaNode = (
  tree: ModelTree<JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta>,
  id: string,
  kind: JsonSchemaNodeKind,
  key: string | number,
  _fragment: JsonSchemaFragment | null,
  source: any,
  parent: JsonSchemaTreeNode | null = null
): CreateNodeResult<JsonSchemaNode> => {
  const required = isRequired(key, parent)

  if (_fragment === null) {
    return { node: tree.createNode(id, kind, key, { parent, meta: { required } }), value: null }
  }

  let res = { value: _fragment, node: {} } as CreateNodeResult<JsonSchemaNode>

  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    const params = { type: complexityType, parent, meta: { ...nestedMeta(_fragment), required, _fragment } }
    res.node = tree.createComplexNode(id, kind, key, params)
  } else if (isRefNode(_fragment)) {
    const { normalized } = parseRef(_fragment.$ref)
    if (tree.nodes.has(normalized)) {
      res.value = null
      res.node = tree.nodes.get(normalized)!
    } else {
      // resolve and create node in cache
      const _value = transformTitle(resolveRefNode(source, _fragment), normalized) ?? null
      res = createJsonSchemaNode(tree, normalized, "definition", "", _value, source)
    }

    const params = { parent, meta: { required: isRequired(key, parent) } }
    res.node = tree.createRefNode(id, kind, key, res.node ?? null, params)
  } else {
    const { type = "any" } = _fragment
    if (Array.isArray(type) || !type || typeof type !== "string" || !isValidType(type)) {
      throw new Error(`Schema should have type: ${id}`)
    }

    const meta = {
      ...pick<any>(_fragment, jsonSchemaNodeMetaProps),
      required,
      _fragment,
    } as JsonSchemaNodeMeta

    const value = pick<any>(_fragment, jsonSchemaNodeValueProps[type]) as JsonSchemaNodeValue

    res.node = tree.createNode(id, kind, key, { value, meta, parent })
  }

  return res
}

export const createJsonSchemaTreeCrawlHook = (tree: JsonSchemaModelTree): SyncCrawlHook => {
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

    const res = createJsonSchemaNode(tree, id, kind, ctx.key, value as JsonSchemaFragment, source, parent)

    if (container) {
      container.addNestedNode(res.node)
    } else {
      parent?.addChild(res.node)
    }

    if (res.value) {
      const _node = getTargetNode(tree, res.node)
      const state = isJsonSchemaTreeNode(res.node) ? { parent: _node, source } : { parent, container: _node, source }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}
