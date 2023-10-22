import { buildPointer, isRefNode, parseRef, resolveRefNode } from "allof-merge"
import { CrawlContext, SyncCrawlHook } from 'json-crawl'

import { 
  GraphSchemaCrawlState, GraphSchemaNodeValue, GraphSchemaComplexNode, GraphSchemaNode, 
  GraphSchemaTreeNode, GraphSchemaFragment, GraphSchemaNodeKind, 
  GraphSchemaCrawlRule, GraphSchemaModelTree, GraphSchemaNodeMeta 
} from "./graphSchema.types"
import { graphSchemaNodeKind, graphSchemaNodeMetaProps, graphSchemaNodeValueProps } from "./graphSchema.consts"
import { getNodeComplexityType, getTargetNode, pick } from "../utils"
import { modelTreeNodeType } from "../consts"
import { CreateNodeResult } from "../types"
import { isRequired } from "../jsonSchema"
import { ModelTree } from "../modelTree"

export const createGraphSchemaNode = (
  tree: ModelTree<GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta>,
  id: string,
  kind: GraphSchemaNodeKind,
  key: string | number,
  _fragment: GraphSchemaFragment, 
  source: any,
  parent: GraphSchemaTreeNode<any> | null = null,
  countInDepth = true
): CreateNodeResult<GraphSchemaNode> => {
  const required = isRequired(key, parent)

  if (_fragment === null) {
    return { node: tree.createNode(id, kind, key, { parent, meta: { required }, countInDepth }), value: null }
  }

  let res = { value: _fragment, node: {} } as CreateNodeResult<GraphSchemaNode>
  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    const params = { type: complexityType, parent, meta: { required, _fragment }, countInDepth }
    res.node = tree.createComplexNode(id, kind, key, params)
  } else if (isRefNode(_fragment)) {
    const { normalized } = parseRef(_fragment.$ref)
    // check if node in cache
    if (tree.nodes.has(_fragment.$ref)) {
      res.value = null
      res.node = tree.nodes.get(_fragment.$ref)! as GraphSchemaNode
    } else {
      // resolve and create node in cache
      const _value = resolveRefNode(source, _fragment)
      res = createGraphSchemaNode(tree, normalized, graphSchemaNodeKind.definition, "", _value, source)
    }

    const params = { parent, meta: { required: isRequired(key, parent) }, countInDepth }
    res.node = tree.createRefNode(id, kind, key, res.node ?? null, params)
  } else {
    const { type } = _fragment
    if (!type || typeof type !== 'string') { 
      throw new Error (`Schema should have type: ${id}`)
    }
    
    const meta: GraphSchemaNodeMeta = {
      ...pick<any>(_fragment, graphSchemaNodeMetaProps),
      required,
      _fragment  
    } 

    const value = pick<any>(_fragment, graphSchemaNodeValueProps[type]) as GraphSchemaNodeValue<typeof type>

    res.node = tree.createNode(id, kind, key, { value, parent, meta, countInDepth })
  }

  return res
}

export const createGraphSchemaTreeCrawlHook = (tree: GraphSchemaModelTree): SyncCrawlHook => {
  const graphSchemaNodeKinds = Object.keys(graphSchemaNodeKind)

  return (value, ctx: CrawlContext<GraphSchemaCrawlState, GraphSchemaCrawlRule>) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !graphSchemaNodeKinds.includes(ctx.rules.kind) || Array.isArray(value)) { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, container, source } = ctx.state
    const { kind } = ctx.rules

    // do not count depth for nested nodes if depth of the container is not counted
    const countInDepth = container ? container.depth !== container.parent?.depth : true
 
    const res = createGraphSchemaNode(tree, id, kind, ctx.key, value as GraphSchemaFragment, source, parent, kind !== 'args' && countInDepth)

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
      const _node = getTargetNode(tree, res.node)
      const state = res.node.type === modelTreeNodeType.simple
        ? { parent: _node as GraphSchemaTreeNode<any>, source }
        : { parent, container: _node as GraphSchemaComplexNode<any>, source }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}
