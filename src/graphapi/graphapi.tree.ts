import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"
import { GraphApiDirectiveDefinition, GraphApiSchema } from "gqlapi"

import { GraphSchemaFragment, GraphSchemaTreeNode, createGraphSchemaNode, createGraphSchemaTreeCrawlHook, createTransformHook } from "../graphSchema"

import { graphApiNodeKind, graphApiNodeKinds } from "./graphapi.consts"
import { graphApiCrawlRules } from "./graphapi.rules"
import { ModelTree } from "../modelTree"

const createGraphApiTreeCrawlHook = (tree: ModelTree<any, any>): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !(graphApiNodeKinds.includes(ctx.rules.kind))) { return { value, state: ctx.state } }

    const id = "#" + buildPointer(ctx.path)
    const { parent } = ctx.state
    const { kind } = ctx.rules
 
    let node
    switch (kind) {
      case graphApiNodeKind.query: 
      case graphApiNodeKind.mutation: 
      case graphApiNodeKind.subscription: {
        node = createGraphSchemaNode(tree, id, kind, ctx.key, value as GraphSchemaFragment, parent, false)
        break;
      }
      case graphApiNodeKind.schema: {
        const { description } = value as GraphApiSchema
        const data = { ...description ? { description } : {},_fragment: value }
        node = tree.createNode(id, kind, ctx.key, data, parent, false)
        break;
      }
      case graphApiNodeKind.directive: {
        const { args, ...rest } = value as GraphApiDirectiveDefinition
        const data = { ...rest, _fragment: value }
        node = tree.createNode(id, kind, ctx.key, data, parent)
        break;
      }
    }

    parent?.addChild(node)

    return { value, state: { parent: node as GraphSchemaTreeNode<any> } }
  }
}


export const createGraphApiTree = (schema: GraphApiSchema) => {
  const tree = new ModelTree<any, any>()
  const crawlState = { parent: null }

  syncCrawl(
    schema,
    [
      createGraphApiTreeCrawlHook(tree),
      createTransformHook(schema),
      createGraphSchemaTreeCrawlHook(tree, schema)
    ], 
    { state: crawlState, rules: graphApiCrawlRules }
  )

  return tree
}
