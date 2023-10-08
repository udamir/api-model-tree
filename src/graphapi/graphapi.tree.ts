import { GraphApiDirectiveDefinition, GraphApiSchema } from "gqlapi"
import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { 
  GraphSchemaComplexNode, GraphSchemaFragment, GraphSchemaModelTree, GraphSchemaNodeMeta, GraphSchemaTreeNode, createGraphSchemaNode, 
  createGraphSchemaTreeCrawlHook, createTransformHook, graphSchemaNodeKinds 
} from "../graphSchema"

import { graphApiNodeKind, graphApiNodeKinds, graphqlEmbeddedDirectives } from "./graphapi.consts"
import { graphApiCrawlRules } from "./graphapi.rules"
import { modelTreeNodeType } from "../consts"
import { isRequired } from "../jsonSchema"
import { ModelTree } from "../modelTree"
import { GraphApiNodeData, GraphApiNodeKind } from "./graphapi.types"

const createGraphApiTreeCrawlHook = (tree: ModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !(graphApiNodeKinds.includes(ctx.rules.kind))) { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent } = ctx.state
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
        const params = {
          value: { ...description ? { description } : {}, _fragment: value }, 
          parent, 
          meta: { required: isRequired(ctx.key, parent) }, 
          countInDepth: false
        }
        node = tree.createNode(id, kind, ctx.key, params)
        break;
      }
      case graphApiNodeKind.directive: {
        if (graphqlEmbeddedDirectives.includes(String(ctx.key))) { return null } 
        const { args, ...rest } = value as GraphApiDirectiveDefinition
        const params = {
          value: { ...rest, _fragment: value },
          parent,
          meta: { required: isRequired(ctx.key, parent) }
        }
        node = tree.createNode(id, kind, ctx.key, params)
        break;
      }
    }

    parent?.addChild(node)
    const state = node!.type === modelTreeNodeType.simple 
      ? { parent: node as GraphSchemaTreeNode<any> } 
      : { parent, container: node as GraphSchemaComplexNode<any> }
    return { value, state }
  }
}


export const createGraphApiTree = (schema: GraphApiSchema) => {
  const tree = new ModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>()
  const crawlState = { parent: null }

  syncCrawl(
    schema,
    [
      createTransformHook(schema, [
        ...graphSchemaNodeKinds, 
        graphApiNodeKind.query, 
        graphApiNodeKind.subscription, 
        graphApiNodeKind.mutation
      ]),
      createGraphApiTreeCrawlHook(tree),
      createGraphSchemaTreeCrawlHook(tree as GraphSchemaModelTree, schema)
    ], 
    { state: crawlState, rules: graphApiCrawlRules }
  )

  return tree
}
