import { SyncCrawlHook, isObject, syncCrawl } from 'json-crawl'
import { buildPointer, merge } from "allof-merge"

import type { 
  JsonSchemaCrawlState, JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta,
  JsonSchemaCrawlRule, JsonSchemaComplexNode }
from "./jsonSchema.types"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { isJsonSchemaTreeNode } from './jsonSchema.utils'
import { jsonSchemaNodeKinds } from './jsonSchema.consts'
import { JsonSchemaModelTree } from "./jsonSchema.tree"
import { createTransformCrawlHook } from '../transform'

export const createJsonSchemaTreeCrawlHook = (tree: JsonSchemaModelTree): SyncCrawlHook<JsonSchemaCrawlState, JsonSchemaCrawlRule> => {
  return ({ key, value, path, rules, state}) => {
    if (!rules) {
      return { done: true }
    }
    if (!jsonSchemaNodeKinds.includes(rules?.kind) || Array.isArray(value)) {
      return
    }

    const id = "#" + buildPointer(path)
    const { parent, container } = state
    const { kind } = rules

    const res = container
      ? tree.createNestedNode(id, kind, key, value, container)
      : tree.createChildNode(id, kind, key, value, parent)

    if (res.value) {
      const _node = tree.getTargetNode(res.node)
      const state = isJsonSchemaTreeNode(res.node) ? { parent: _node } : { parent, container: _node as JsonSchemaComplexNode }
      return { value: res.value, state }
    } else {
      return { done: true }
    }
  }
}

export const createJsonSchemaTree = (schema: unknown, source: any = schema) => {

  const tree = new JsonSchemaModelTree<JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta>(source)
  if (!isObject(schema) || !isObject(source)) {
    return tree
  }

  const data = merge(schema, { source, mergeRefSibling: true, mergeCombinarySibling: true })

  const crawlState: JsonSchemaCrawlState = { parent: null }

  syncCrawl(data, [
    createTransformCrawlHook(source),
    createJsonSchemaTreeCrawlHook(tree)
  ], { state: crawlState, rules: jsonSchemaCrawlRules() })

  return tree
}

