import { buildPointer, isRefNode, parseRef, resolveRefNode } from "allof-merge"
import { CrawlContext, SyncCrawlHook } from 'json-crawl'

import { 
  GraphSchemaCrawlState, GraphSchemaNodeValue, GraphSchemaComplexNode, GraphSchemaNode, 
  GraphSchemaTreeNode, GraphSchemaFragment, GraphSchemaNodeKind, 
  GraphSchemaCrawlRule, GraphSchemaModelTree, GraphSchemaNodeMeta 
} from "./graphSchema.types"
import { graphSchemaNodeKind, graphSchemaNodeMetaProps, graphSchemaNodeValueProps } from "./graphSchema.consts"
import { getNodeComplexityType, pick } from "../utils"
import { modelTreeNodeType } from "../consts"
import { isRequired } from "../jsonSchema"
import { ModelDataNode } from "../types"
import { ModelTree } from "../modelTree"

export const createGraphSchemaNode = (
  tree: ModelTree<GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta>,
  id: string,
  kind: GraphSchemaNodeKind,
  key: string | number,
  _fragment: GraphSchemaFragment, 
  parent: GraphSchemaTreeNode<any> | null = null,
  countInDepth = true
): GraphSchemaNode<any> => {
  const required = isRequired(key, parent)

  if (_fragment === null) {
    return tree.createNode(id, kind, key, { parent, meta: { required }, countInDepth })
  }

  const complexityType = getNodeComplexityType(_fragment)
  if (complexityType !== modelTreeNodeType.simple) {
    const params = { type: complexityType, parent, meta: { required, _fragment }, countInDepth }
    return tree.createComplexNode(id, kind, key, params)
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

    return tree.createNode(id, kind, key, { value: value, parent, meta, countInDepth })
  }
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
 
    if (isRefNode(value)) {
      let refData = null
      // check if node in cache
      let node: ModelDataNode<GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta> | undefined
      if (tree.nodes.has(value.$ref)) {
        node = tree.nodes.get(value.$ref)!
      } else {
        // resolve and create node in cache
        refData = resolveRefNode(source, value)
        const { normalized } = parseRef(value.$ref)

        node = createGraphSchemaNode(tree, normalized, graphSchemaNodeKind.definition, "", refData ?? null)
      }

      if (container) {
        const params = { parent: container.parent, meta: { required: isRequired(ctx.key, container.parent) }, countInDepth }
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, params)
        container.addNestedNode(refNode)
      } else if (parent) {
        const params = { parent, meta: { required: isRequired(ctx.key, parent) }}
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, params)
        parent.addChild(refNode)
      }
        
      if (refData) {
        const state = node.type === modelTreeNodeType.simple 
          ? { parent: node as GraphSchemaTreeNode<any>, source }
          : { parent, container: node as GraphSchemaComplexNode<any>, source }
        return { value: refData, state }
      } else {
        return null
      }
    } 
        
    const node = createGraphSchemaNode(tree, id, kind, ctx.key, value as GraphSchemaFragment, parent, kind !== 'args' && countInDepth)

    if (node.kind === 'args') {
      const nested = container ? container.nested : parent!.nested
      // put args node as nested with index -1
      nested[-1] = node
    } else if (container) {
      container.addNestedNode(node)
    } else {
      parent?.addChild(node)
    }

    const state = node.type === modelTreeNodeType.simple
      ? { parent: node as GraphSchemaTreeNode<any>, source }
      : { parent, container: node as GraphSchemaComplexNode<any>, source }
    return { value, state }
  }
}
