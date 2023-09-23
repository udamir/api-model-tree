import { buildPointer, isRefNode, parseRef, resolvePointer, resolveRefNode } from "allof-merge"
import { SyncCloneHook, syncClone, syncCrawl } from 'json-crawl'

import { 
  GraphSchemaCrawlState, GraphSchemaNodeData, GraphSchemaComplexNode, GraphSchemaNode, 
  GraphSchemaTreeNode, GraphSchemaFragment, GraphSchemaNodeKind 
} from "./graphSchema.types"
import { getNodeComplexityType, isObject, pick } from "../utils"
import { graphSchemaTransormers } from "./graphSchema.utils"
import { graphSchemaCrawlRules } from "./graphSchema.rules"
import { graphSchemaTypeProps } from "./graphSchema.consts"
import { modelTreeNodeType } from "../consts"
import { IModelTreeNode } from "../types"
import { ModelTree } from "../modelTree"

export const transformGraphSchema = (schema: GraphSchemaFragment, source: any = schema) => {

  const transformHook: SyncCloneHook = (value, ctx) => {
    // skip if not object or current node graph-schema
    if ((!isObject(value) || Array.isArray(value)) || !ctx.rules?.kind) { 
      return { value } 
    }
    
    const transformed = graphSchemaTransormers.reduce((current, transformer) => transformer(current), value as any)

    const { $ref, ...sibling } = transformed

    if ($ref && Object.keys(sibling).length) {
      // resolve ref
      const _ref = parseRef($ref)
      const refData = resolvePointer(source, _ref.pointer) 
      // merge 
      return refData ? { value: { ...refData, ...sibling } } : { value: transformed }
    }

    return { value: transformed }
  }

  return syncClone(schema, transformHook, { rules: graphSchemaCrawlRules() })
}

const createGraphSchemaNode = (
  tree: ModelTree<GraphSchemaNodeData<any>, GraphSchemaNodeKind>,
  id: string,
  kind: GraphSchemaNodeKind,
  key: string | number,
  value: GraphSchemaFragment, 
  parent: GraphSchemaTreeNode<any> | null = null
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
    
    const { args, directives, ...rest } = value

    const data = { 
      ...pick<any>(rest, graphSchemaTypeProps[type]),
      _fragment: value
    } as GraphSchemaNodeData<typeof type>

    return tree.createNode(id, kind, key, data, parent)
  }
}

export const createGraphSchemaTree = (schema: GraphSchemaFragment, source: any = schema) => {
  const tree = new ModelTree<GraphSchemaNodeData<any>, GraphSchemaNodeKind>()
  const data = transformGraphSchema(schema, source)

  const crawlState: GraphSchemaCrawlState = { parent: null }

  syncCrawl(data, (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || Array.isArray(value)) { return { value, state: ctx.state } }

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
        
    const node = createGraphSchemaNode(tree, id, kind, ctx.key, value as GraphSchemaFragment, parent)

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
  }, { state: crawlState, rules: graphSchemaCrawlRules() })

  return tree
}
