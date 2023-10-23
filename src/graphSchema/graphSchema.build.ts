import { CrawlContext, SyncCrawlHook, syncCrawl } from 'json-crawl'

import { 
  GraphSchemaCrawlState, GraphSchemaNodeValue, GraphSchemaFragment, GraphSchemaNodeKind, GraphSchemaNodeMeta, GraphSchemaCrawlRule 
} from "./graphSchema.types"

import { graphSchemaCrawlRules } from "./graphSchema.rules"
import { graphSchemaNodeKind } from './graphSchema.consts'
import { GraphSchemaModelTree } from "./graphSchema.tree"
import { createTransformCrawlHook } from "../transform"
import { modelTreeNodeType } from '../consts'
import { buildPointer } from 'allof-merge'

export const createGraphSchemaTreeCrawlHook = (tree: GraphSchemaModelTree): SyncCrawlHook => {
  const graphSchemaNodeKinds = Object.keys(graphSchemaNodeKind)

  return (value, ctx: CrawlContext<GraphSchemaCrawlState, GraphSchemaCrawlRule>) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !graphSchemaNodeKinds.includes(ctx.rules.kind) || Array.isArray(value)) { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, container } = ctx.state
    const { kind } = ctx.rules

    // do not count depth for nested nodes if depth of the container is not counted
    const countInDepth = container ? container.depth !== container.parent?.depth : true
 
    const res = tree.createGraphSchemaNode({ id, kind, key: ctx.key, value, parent, countInDepth: kind !== 'args' && countInDepth })

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
      const state = res.node.type === modelTreeNodeType.simple  ? { parent: _node } : { parent, container: _node }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}

export const createGraphSchemaTree = (schema: GraphSchemaFragment, source: any = schema): GraphSchemaModelTree => {
  const tree = new GraphSchemaModelTree<GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta>(source)
  const crawlState: GraphSchemaCrawlState = { parent: null }

  syncCrawl(
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
