import { SyncCrawlHook, isObject, syncCrawl } from 'json-crawl'
import { buildPointer, merge } from "allof-merge"

import { JsonSchemaCrawlState, JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta } from "./jsonSchema.types"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { isJsonSchemaTreeNode } from './jsonSchema.utils'
import { jsonSchemaNodeKinds } from './jsonSchema.consts'
import { JsonSchemaModelTree } from "./jsonSchema.tree"
import { createTransformCrawlHook } from '../transform'

export const createJsonSchemaTreeCrawlHook = (tree: JsonSchemaModelTree): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) {
      return null
    }
    if (!jsonSchemaNodeKinds.includes(ctx.rules?.kind) || Array.isArray(value)) {
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, container } = ctx.state
    const { kind } = ctx.rules

    const res = container
      ? tree.createNestedNode(id, kind, ctx.key, value, container)
      : tree.createChildNode(id, kind, ctx.key, value, parent)

    if (res.value) {
      const _node = tree.getTargetNode(res.node)
      const state = isJsonSchemaTreeNode(res.node) ? { parent: _node } : { parent, container: _node }
      return { value: res.value, state }
    } else {
      return null
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

