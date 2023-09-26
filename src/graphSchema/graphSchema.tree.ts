import { buildPointer, isRefNode, parseRef, resolvePointer, resolveRefNode } from "allof-merge"
import { SyncCrawlHook, syncCrawl } from 'json-crawl'

import { 
  GraphSchemaCrawlState, GraphSchemaNodeData, GraphSchemaComplexNode, GraphSchemaNode, 
  GraphSchemaTreeNode, GraphSchemaFragment, GraphSchemaNodeKind, GraphSchemaTransformFunc 
} from "./graphSchema.types"
import { getNodeComplexityType, isObject, pick } from "../utils"
import { graphSchemaCrawlRules } from "./graphSchema.rules"
import { graphSchemaNodeKind, graphSchemaTypeProps } from "./graphSchema.consts"
import { modelTreeNodeType } from "../consts"
import { IModelTreeNode } from "../types"
import { ModelTree } from "../modelTree"

export const createTransformHook = (source: any): SyncCrawlHook => {
  return (value, { rules, state }) => {
    // skip if not object or current node graph-schema
    const graphSchemaNodeKinds = Object.keys(graphSchemaNodeKind)

    if ((!isObject(value) || Array.isArray(value)) || !rules?.kind || !graphSchemaNodeKinds.includes(rules.kind)) { 
      return { value, state } 
    }

    const graphSchemaTransormers: GraphSchemaTransformFunc[] = rules.transformers ?? []
    const transformed = graphSchemaTransormers.reduce((current, transformer) => transformer(current), value as any)

    const { $ref, ...sibling } = transformed

    if ($ref && Object.keys(sibling).length) {
      // resolve ref
      const _ref = parseRef($ref)
      const refData = resolvePointer(source, _ref.pointer) 
      // merge 
      return refData ? { value: { ...refData, ...sibling } } : { value: transformed }
    }

    return { value: transformed, state }
  }
}

export const createGraphSchemaNode = (
  tree: ModelTree<GraphSchemaNodeData<any>, GraphSchemaNodeKind>,
  id: string,
  kind: GraphSchemaNodeKind,
  key: string | number,
  value: GraphSchemaFragment, 
  parent: GraphSchemaTreeNode<any> | null = null,
  count = true
): GraphSchemaNode<any> => {
  if (value === null) {
    return tree.createNode(id, kind, key, null, parent)
  }

  const complexityType = getNodeComplexityType(value)
  if (complexityType !== modelTreeNodeType.simple) {
    return tree.createComplexNode(id, kind, key, complexityType, parent)
  } else {
    const { type } = value
    if (!type || typeof type !== 'string') { 
      throw new Error (`Schema should have type: ${id}`)
    }
    
    const { args, ...rest } = value

    const data = { 
      ...pick<any>(rest, graphSchemaTypeProps[type]),
      _fragment: value
    } as GraphSchemaNodeData<typeof type>

    return tree.createNode(id, kind, key, data, parent, count)
  }
}

export const createGraphSchemaTreeCrawlHook = (tree: ModelTree<GraphSchemaNodeData<any>, GraphSchemaNodeKind>, source: any): SyncCrawlHook => {
  const graphSchemaNodeKinds = Object.keys(graphSchemaNodeKind)

  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !graphSchemaNodeKinds.includes(ctx.rules.kind) || Array.isArray(value)) { return { value, state: ctx.state } }

    const id = "#" + buildPointer(ctx.path)
    const { parent, container } = ctx.state
    const { kind } = ctx.rules

    if (isRefNode(value)) {
      let refData = null
      // check if node in cache
      let node: IModelTreeNode<GraphSchemaNodeData<any>, GraphSchemaNodeKind> | undefined
      if (tree.nodes.has(value.$ref)) {
        node = tree.nodes.get(value.$ref)!
      } else {
        // resolve and create node in cache
        refData = resolveRefNode(source, value)
        const { normalized } = parseRef(value.$ref)

        node = createGraphSchemaNode(tree, normalized, "definition", "", refData ?? null)
      }

      if (container) {
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, container.parent)
        container.addNestedNode(refNode)
      } else if (parent) {
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, parent)
        parent.addChild(refNode)
      }
        
      if (refData) {
        const state = node.type === 'simple' ? { parent: node as GraphSchemaTreeNode<any> } : { parent, container: node as GraphSchemaComplexNode<any> }
        return { value: refData, state }
      } else {
        return null
      }
    } 
        
    const node = createGraphSchemaNode(tree, id, kind, ctx.key, value as GraphSchemaFragment, parent, kind !== 'args')

    if (node.kind === 'args') {
      const nested = container ? container.nested : parent!.nested
      nested[-1] = node
    } else if (container) {
      container.addNestedNode(node)
    } else {
      parent?.addChild(node)
    }

    const state = node.type === 'simple' ? { parent: node as GraphSchemaTreeNode<any> } : { parent, container: node as GraphSchemaComplexNode<any> }
    return { value, state }
  }
}

export const createGraphSchemaTree = (schema: GraphSchemaFragment, source: any = schema) => {
  const tree = new ModelTree<GraphSchemaNodeData<any>, GraphSchemaNodeKind>()
  const crawlState: GraphSchemaCrawlState = { parent: null }

  syncCrawl(
    schema,
    [ createTransformHook(source), createGraphSchemaTreeCrawlHook(tree, source)], 
    { state: crawlState, rules: graphSchemaCrawlRules() }
  )

  return tree
}
