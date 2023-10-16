import { GraphApiDirectiveDefinition, GraphApiSchema } from "gqlapi"
import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { 
  GraphSchemaComplexNode, GraphSchemaFragment, GraphSchemaModelTree, GraphSchemaNodeMeta, GraphSchemaTreeNode, createGraphSchemaNode, 
  createGraphSchemaTreeCrawlHook 
} from "../graphSchema"

import { graphApiNodeKind, graphApiNodeKinds, graphqlEmbeddedDirectives } from "./graphapi.consts"
import { graphApiCrawlRules } from "./graphapi.rules"
import { modelTreeNodeType } from "../consts"
import { isRequired } from "../jsonSchema"
import { ModelTree } from "../modelTree"
import { GraphApiNodeData, GraphApiNodeKind } from "./graphapi.types"
import { ModelTreeNodeParams } from "../types"
import { transformCrawlHook } from "../transform"

const createGraphApiTreeCrawlHook = (tree: ModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !(graphApiNodeKinds.includes(ctx.rules.kind))) { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, source } = ctx.state
    const { kind } = ctx.rules
 
    let node
    switch (kind) {
      case graphApiNodeKind.query: 
      case graphApiNodeKind.mutation: 
      case graphApiNodeKind.subscription: {
        node = createGraphSchemaNode(tree as GraphSchemaModelTree, id, kind, ctx.key, value as GraphSchemaFragment, parent, false)
        break;
      }
      case graphApiNodeKind.schema: {
        const { description } = value as GraphApiSchema
        const params: ModelTreeNodeParams<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta> = {
          value: { ...description ? { description } : {} }, 
          parent, 
          meta: { required: isRequired(ctx.key, parent), _fragment: value }, 
          countInDepth: false
        }
        node = tree.createNode(id, kind, ctx.key, params)
        break;
      }
      case graphApiNodeKind.directive: {
        if (graphqlEmbeddedDirectives.includes(String(ctx.key))) { return null } 
        const { args, ...rest } = value as GraphApiDirectiveDefinition
        const params: ModelTreeNodeParams<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta> = {
          value: rest,
          parent,
          meta: { required: isRequired(ctx.key, parent), _fragment: value }
        }
        node = tree.createNode(id, kind, ctx.key, params)
        break;
      }
    }

    parent?.addChild(node)
    const state = node!.type === modelTreeNodeType.simple 
      ? { parent: node as GraphSchemaTreeNode<any>, source } 
      : { parent, container: node as GraphSchemaComplexNode<any>, source }
    return { value, state }
  }
}


export const createGraphApiTree = (schema: GraphApiSchema) => {
  const tree = new ModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>()
  const crawlState = { parent: null, source: schema }

  syncCrawl(
    schema,
    [
      transformCrawlHook, 
      createGraphApiTreeCrawlHook(tree),
      createGraphSchemaTreeCrawlHook(tree as GraphSchemaModelTree)
    ], 
    { state: crawlState, rules: graphApiCrawlRules }
  )

  return tree
}
