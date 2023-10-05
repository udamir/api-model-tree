import { GraphApiDirectiveDefinition, GraphApiSchema } from "gqlapi"
import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { GraphSchemaComplexNode, GraphSchemaFragment, GraphSchemaTreeNode, createGraphSchemaNode, createGraphSchemaTreeCrawlHook, createTransformHook, graphSchemaNodeKinds } from "../graphSchema"

import { graphApiNodeKind, graphApiNodeKinds, graphqlEmbeddedDirectives } from "./graphapi.consts"
import { graphApiCrawlRules } from "./graphapi.rules"
import { isRequired } from "../jsonSchema"
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
        node = tree.createNode(id, kind, ctx.key, { value: data, parent, required: isRequired(ctx.key, parent), countInDepth: false })
        break;
      }
      case graphApiNodeKind.directive: {
        if (graphqlEmbeddedDirectives.includes(String(ctx.key))) { return null } 
        const { args, ...rest } = value as GraphApiDirectiveDefinition
        const data = { ...rest, _fragment: value }
        node = tree.createNode(id, kind, ctx.key, { value: data, parent, required: isRequired(ctx.key, parent) })
        break;
      }
    }

    parent?.addChild(node)
    const state = node!.type === 'simple' ? { parent: node as GraphSchemaTreeNode<any> } : { parent, container: node as GraphSchemaComplexNode<any> }
    return { value, state }
  }
}


export const createGraphApiTree = (schema: GraphApiSchema) => {
  const tree = new ModelTree<any, any>()
  const crawlState = { parent: null }

  syncCrawl(
    schema,
    [
      createTransformHook(schema, [...graphSchemaNodeKinds, graphApiNodeKind.query, graphApiNodeKind.subscription, graphApiNodeKind.mutation]),
      createGraphApiTreeCrawlHook(tree),
      createGraphSchemaTreeCrawlHook(tree, schema)
    ], 
    { state: crawlState, rules: graphApiCrawlRules }
  )

  return tree
}
