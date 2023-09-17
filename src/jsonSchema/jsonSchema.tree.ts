import { 
  allOfResolverHook, buildPointer, isRefNode, 
  jsonSchemaMergeRules, parseRef, resolveRefNode 
} from "allof-merge"
import { SyncCloneHook, isObject, syncClone, syncCrawl } from 'json-crawl'

import { 
  JsonSchemaCrawlState, JsonSchemaNodeData, JsonSchemaNode, 
  JsonSchemaTreeNode, JsonSchemaFragment, JsonSchemaNodeKind, JsonSchemaComplexNode 
} from "./jsonSchema.types"
import { transormers, isValidType, transformTitle, isJsonSchemaTreeNode } from "./jsonSchema.utils"
import { jsonSchemaNodeKind, jsonSchemaTypeProps } from "./jsonSchema.consts"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { getNodeComplexityType, pick } from "../utils"
import { IModelTreeNode } from "../types"
import { ModelTree } from "../modelTree"
import { modelTreeNodeType } from "../consts"

export const transformJsonSchema = (schema: JsonSchemaFragment, source: any = schema) => {

  const transformHook: SyncCloneHook = (value, ctx) => {
    // skip if not object or current node json-schema
    if ((!isObject(value) || isRefNode(value) || Array.isArray(value)) || !ctx.rules?.["/allOf"] || !( "$" in ctx.rules["/allOf"])) { 
      return { value } 
    }
    
    const transformed = transormers.reduce((current, transformer) => transformer(current), value as any)

    return { value: transformed }
  }

  const options = { source, mergeRefSibling: true, mergeCombinarySibling: true }
  const params = { rules: jsonSchemaMergeRules("draft-06") }
  return syncClone(schema, [transformHook, allOfResolverHook(options)], params)
}

const createJsonSchemaNode = (
  tree: ModelTree<JsonSchemaNodeData<any>, JsonSchemaNodeKind>,
  id: string,
  kind: JsonSchemaNodeKind,
  key: string | number,
  value: JsonSchemaFragment | null, 
  parent: JsonSchemaTreeNode<any> | null = null
): JsonSchemaNode<any> => {
  if (value === null) {
    return tree.createNode(id, kind, key, null, parent)
  }
  
  const complexityType = getNodeComplexityType(value)
  if (complexityType !== modelTreeNodeType.simple) {
    return tree.createComplexNode(id, kind, key, complexityType, parent)
  } else {
    const { type = "any" } = value
    if (!type || typeof type !== 'string' || !isValidType(type)) { 
      throw new Error (`Schema should have type: ${id}`)
    }
    
    const data = { 
      ...pick<any>(value, jsonSchemaTypeProps[type]),
      _fragment: value
    } as JsonSchemaNodeData<typeof type>

    return tree.createNode(id, kind, key, data, parent)
  }
}

export const createJsonSchemaTree = (schema: JsonSchemaFragment, source: any = schema) => {

  const tree = new ModelTree<JsonSchemaNodeData<any>, JsonSchemaNodeKind>()
  if (!isObject(schema) || !isObject(source)) {
    return tree
  }

  const data = transformJsonSchema(schema, source)

  const crawlState: JsonSchemaCrawlState = { parent: null }

  syncCrawl(data, (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || Array.isArray(value)) { return { value, state: ctx.state } }

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
        node = createJsonSchemaNode(tree, normalized, jsonSchemaNodeKind.definition, "", refData ? transformTitle(refData, normalized) : null)
      }

      if (container) {
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, container.parent)
        container.addNestedNode(refNode)
      } else if (parent) {
        const refNode = tree.createRefNode(id, kind, ctx.key, node ?? null, parent)
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
  }, { state: crawlState, rules: jsonSchemaCrawlRules() })

  return tree
}
