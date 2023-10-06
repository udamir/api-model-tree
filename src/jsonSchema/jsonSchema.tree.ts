import { 
  allOfResolverHook, buildPointer, isRefNode, 
  jsonSchemaMergeRules, merge, parseRef, resolveRefNode 
} from "allof-merge"
import { SyncCloneHook, SyncCrawlHook, isObject, syncClone, syncCrawl } from 'json-crawl'

import { 
  JsonSchemaCrawlState, JsonSchemaNodeData, JsonSchemaNode, 
  JsonSchemaTreeNode, JsonSchemaFragment, JsonSchemaNodeKind, JsonSchemaComplexNode, JsonSchemaModelTree 
} from "./jsonSchema.types"
import { isValidType, transformTitle, isJsonSchemaTreeNode, isRequired } from "./jsonSchema.utils"
import { jsonSchemaNodeKind, jsonSchemaNodeKinds, jsonSchemaTypeProps } from "./jsonSchema.consts"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { getNodeComplexityType, pick } from "../utils"
import { modelTreeNodeType } from "../consts"
import { IModelTreeNode, SchemaTransformFunc } from "../types"
import { ModelTree } from "../modelTree"


export const createJsonSchemaNode = (
  tree: ModelTree<JsonSchemaNodeData<any>, JsonSchemaNodeKind>,
  id: string,
  kind: JsonSchemaNodeKind,
  key: string | number,
  value: JsonSchemaFragment | null, 
  parent: JsonSchemaTreeNode<any> | null = null
): JsonSchemaNode<any> => {
  if (value === null) {
    return tree.createNode(id, kind, key, { parent, required: isRequired(key, parent) })
  }
  
  const complexityType = getNodeComplexityType(value)
  if (complexityType !== modelTreeNodeType.simple) {
    return tree.createComplexNode(id, kind, key, { type: complexityType, parent })
  } else {
    const { type = "any" } = value
    if (!type || typeof type !== 'string' || !isValidType(type)) { 
      throw new Error (`Schema should have type: ${id}`)
    }
    
    const data = { 
      ...pick<any>(value, jsonSchemaTypeProps[type]),
      _fragment: value
    } as JsonSchemaNodeData<typeof type>

    return tree.createNode(id, kind, key, { value: data, parent, required: isRequired(key, parent) })
  }
}

export const createJsonSchemaTreeCrawlHook = (tree: JsonSchemaModelTree, source: any): SyncCrawlHook => {
  return (_value, ctx) => {
    if (!ctx.rules) { return null }
    if (!(jsonSchemaNodeKinds.includes(ctx.rules?.kind)) || Array.isArray(_value)) { 
      return { value: _value, state: ctx.state }
    }

    const jsonSchemaTransormers: SchemaTransformFunc<JsonSchemaFragment>[] = ctx.rules.transformers ?? []
    const value = jsonSchemaTransormers.reduce((current, transformer) => transformer(current), _value as any)

    const id = "#" + buildPointer(ctx.path)
    const { parent, container } = ctx.state
    const { kind } = ctx.rules

    if (isRefNode(value)) {
      let refData = null
      // check if node in cache
      let node: IModelTreeNode<JsonSchemaNodeData<any>, JsonSchemaNodeKind> | undefined
      if (tree.nodes.has(value.$ref)) {
        node = tree.nodes.get(value.$ref)!
      } else {
        // resolve and create node in cache
        refData = resolveRefNode(source, value)
        const { normalized } = parseRef(value.$ref)
        const _value = refData ? transformTitle(refData, normalized) : null
        node = createJsonSchemaNode(tree, normalized, jsonSchemaNodeKind.definition, "", _value)
      }

      if (container) {
        const params = { parent: container.parent, required: isRequired(ctx.key, container.parent) }
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, params)
        container.addNestedNode(refNode)
      } else if (parent) {
        const params = { parent, required: isRequired(ctx.key, parent) }
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, params)
        parent.addChild(refNode)
      }
        
      if (refData && node) {
        const state = isJsonSchemaTreeNode(node) ? { parent: node } : { parent, container: node as JsonSchemaComplexNode<any> }
        return { value: refData, state }
      } else {
        return null
      }
    } 
      
    const node = createJsonSchemaNode(tree, id, kind, ctx.key, value as JsonSchemaFragment, parent)
    
    if (container) {
      container.addNestedNode(node)
    } else {
      parent?.addChild(node)
    }
    const state = isJsonSchemaTreeNode(node) ? { parent: node } : { parent, container: node as JsonSchemaComplexNode<any> }
    return { value, state }
  }
}

export const createJsonSchemaTree = (schema: JsonSchemaFragment, source: any = schema) => {

  const tree = new ModelTree<JsonSchemaNodeData<any>, JsonSchemaNodeKind>()
  if (!isObject(schema) || !isObject(source)) {
    return tree
  }

  const data = merge(schema, { source, mergeRefSibling: true, mergeCombinarySibling: true })

  const crawlState: JsonSchemaCrawlState = { parent: null }

  syncCrawl(data, createJsonSchemaTreeCrawlHook(tree, source), { state: crawlState, rules: jsonSchemaCrawlRules() })

  return tree
}
