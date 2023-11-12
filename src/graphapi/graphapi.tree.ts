import { GraphApiDirectiveDefinition, GraphApiSchema } from "gqlapi"
import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { 
  GraphSchemaComplexNode, GraphSchemaModelTree, GraphSchemaNodeMeta, GraphSchemaTreeNode, 
  createGraphSchemaTreeCrawlHook 
} from "../graphSchema"

import type { GraphApiCrawlRule, GraphApiCrawlState, GraphApiNodeData, GraphApiNodeKind } from "./graphapi.types"
import { graphApiNodeKind, graphApiNodeKinds, graphqlEmbeddedDirectives } from "./graphapi.consts"
import { createTransformCrawlHook } from "../transform"
import { graphApiCrawlRules } from "./graphapi.rules"
import type { ModelTreeNodeParams } from "../types"
import { modelTreeNodeType } from "../consts"
import { isRequired } from "../jsonSchema"
import { getTargetNode } from "../utils"

const createGraphApiTreeCrawlHook = (tree: GraphSchemaModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>): SyncCrawlHook<GraphApiCrawlState, GraphApiCrawlRule> => {
  return ({ value, state, rules, path, key }) => {
    if (!rules) { return { done: true } }
    if (!("kind" in rules) || !(graphApiNodeKinds.includes(rules.kind))) { return }

    const id = "#" + buildPointer(path)
    const { parent, source } = state
    const { kind } = rules
 
    let res: any = { value, node: {} }
    switch (kind) {
      case graphApiNodeKind.query: 
      case graphApiNodeKind.mutation: 
      case graphApiNodeKind.subscription: {
        res = tree.createGraphSchemaNode({ id, kind, key, value, parent, countInDepth: false })
        break;
      }
      case graphApiNodeKind.schema: {
        const { description } = value as GraphApiSchema
        const params: ModelTreeNodeParams<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta> = {
          value: { ...description ? { description } : {} }, 
          parent, 
          meta: { required: isRequired(key, parent), _fragment: value }, 
          countInDepth: false
        }
        res.node = tree.createNode(id, kind, key, params)
        break;
      }
      case graphApiNodeKind.directive: {
        if (graphqlEmbeddedDirectives.includes(String(key))) { return { done: true } } 
        const { args, ...rest } = value as GraphApiDirectiveDefinition
        const params: ModelTreeNodeParams<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta> = {
          value: rest,
          parent,
          meta: { required: isRequired(key, parent), _fragment: value }
        }
        res.node = tree.createNode(id, kind, key, params)
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
      return { done: true }
    }
  }
}

export const createGraphApiTree = (schema: GraphApiSchema) => {
  const tree = new GraphSchemaModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>(schema)
  const crawlState: GraphApiCrawlState = { parent: null, source: schema }

  syncCrawl<GraphApiCrawlState, GraphApiCrawlRule>(
    schema,
    [
      createTransformCrawlHook<GraphApiCrawlState>(schema), 
      createGraphApiTreeCrawlHook(tree),
      createGraphSchemaTreeCrawlHook(tree as GraphSchemaModelTree) as SyncCrawlHook<any, any>
    ], 
    { state: crawlState, rules: graphApiCrawlRules }
  )

  return tree
}
