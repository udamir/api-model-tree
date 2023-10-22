import { GraphApiDirectiveDefinition, GraphApiSchema } from "gqlapi"
import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { 
  GraphSchemaComplexNode, GraphSchemaFragment, GraphSchemaModelTree, GraphSchemaNodeMeta, GraphSchemaTreeNode, createGraphSchemaNode, 
  createGraphSchemaTreeCrawlHook 
} from "../graphSchema"

import { graphApiNodeKind, graphApiNodeKinds, graphqlEmbeddedDirectives } from "./graphapi.consts"
import { GraphApiNodeData, GraphApiNodeKind, GraphapiTreeNode } from "./graphapi.types"
import { CreateNodeResult, ModelTreeNodeParams } from "../types"
import { createTransformCrawlHook } from "../transform"
import { graphApiCrawlRules } from "./graphapi.rules"
import { modelTreeNodeType } from "../consts"
import { isRequired } from "../jsonSchema"
import { ModelTree } from "../modelTree"
import { getTargetNode } from "../utils"

const createGraphApiTreeCrawlHook = (tree: ModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !(graphApiNodeKinds.includes(ctx.rules.kind))) { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, source } = ctx.state
    const { kind } = ctx.rules
 
    let res = { value, node: {} } as CreateNodeResult<GraphapiTreeNode>
    switch (kind) {
      case graphApiNodeKind.query: 
      case graphApiNodeKind.mutation: 
      case graphApiNodeKind.subscription: {
        res = createGraphSchemaNode(tree as GraphSchemaModelTree, id, kind, ctx.key, value as GraphSchemaFragment, source, parent, false)
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
        res.node = tree.createNode(id, kind, ctx.key, params)
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
        res.node = tree.createNode(id, kind, ctx.key, params)
        break;
      }
    }
    
    parent?.addChild(res.node)

    if (res.value) {
      const _node = getTargetNode(tree, res.node)
      const state = res.node!.type === modelTreeNodeType.simple 
        ? { parent: _node as GraphSchemaTreeNode<any>, source } 
        : { parent, container: _node as GraphSchemaComplexNode<any>, source }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}


export const createGraphApiTree = (schema: GraphApiSchema) => {
  const tree = new ModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>()
  const crawlState = { parent: null, source: schema }

  syncCrawl(
    schema,
    [
      createTransformCrawlHook(schema), 
      createGraphApiTreeCrawlHook(tree),
      createGraphSchemaTreeCrawlHook(tree as GraphSchemaModelTree)
    ], 
    { state: crawlState, rules: graphApiCrawlRules }
  )

  return tree
}
