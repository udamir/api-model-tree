import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from 'allof-merge'

import type { 
  GraphSchemaCrawlState, GraphSchemaNodeValue, GraphSchemaFragment, GraphSchemaNodeKind,
  GraphSchemaNodeMeta, GraphSchemaCrawlRule, GraphSchemaComplexNode, GraphSchemaTreeNode 
} from "./graphSchema.types"

import { graphSchemaCrawlRules } from "./graphSchema.rules"
import { graphSchemaNodeKind } from './graphSchema.consts'
import { GraphSchemaModelTree } from "./graphSchema.tree"
import { createTransformCrawlHook } from "../transform"
import { modelTreeNodeType } from '../consts'

export const createGraphSchemaTreeCrawlHook = (tree: GraphSchemaModelTree): SyncCrawlHook<GraphSchemaCrawlState, GraphSchemaCrawlRule> => {
  const graphSchemaNodeKinds = Object.keys(graphSchemaNodeKind)

  return ({ value, rules, state, path, key }) => {
    if (!rules) { return { done: true } }
    if (!("kind" in rules) || !graphSchemaNodeKinds.includes(rules.kind) || Array.isArray(value)) { 
      return
    }

    const id = "#" + buildPointer(path)
    const { parent, container } = state
    const { kind } = rules

    // do not count depth for nested nodes if depth of the container is not counted
    const countInDepth = container ? container.depth !== container.parent?.depth : true
 
    const res = tree.createGraphSchemaNode({ id, kind, key, value, parent, countInDepth: kind !== 'args' && countInDepth })

    if (kind === 'args') {
      const nested = container ? container.nested : parent!.nested
      // put args node as nested with index -1
      nested[-1] = res.node
    } else if (container) {
      container.addNestedNode(res.node)
    } else {
      parent?.addChild(res.node)
    }

    if (res.value) {
      const _node = tree.getTargetNode(res.node)
      const state = res.node.type === modelTreeNodeType.simple 
        ? { parent: _node as GraphSchemaTreeNode }
        : { parent, container: _node as GraphSchemaComplexNode }
      return { value: res.value, state }
    } else {
      return { done: true }
    }
  }
}

export const createGraphSchemaTree = (schema: GraphSchemaFragment, source: any = schema): GraphSchemaModelTree => {
  const tree = new GraphSchemaModelTree<GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta>(source)
  const crawlState: GraphSchemaCrawlState = { parent: null }

  syncCrawl<GraphSchemaCrawlState, GraphSchemaCrawlRule>(
    schema,
    [ 
      createTransformCrawlHook(source), 
      createGraphSchemaTreeCrawlHook(tree)
    ], 
    { 
      state: crawlState, 
      rules: graphSchemaCrawlRules()
    }
  )

  return tree
}
