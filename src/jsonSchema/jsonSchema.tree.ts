import { buildPointer, isAnyOfNode, isOneOfNode, isRefNode, merge, parseRef, resolveRefNode } from "allof-merge"
import { syncCrawl } from 'json-crawl'

import { JsonSchemaCrawlState, IJsonSchemaNodeData, JsonSchemaComplexNode, JsonSchemaNode, JsonSchemaTreeNode, JsonSchemaFragment, JsonSchemaNodeKind } from "./jsonSchema.types"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { JsonSchemaNodeData } from "./jsonSchema.nodeData"
import { isComplexNode } from "../utils"
import { ModelTree } from "../modelTree"

export class JsonSchemaTree extends ModelTree<IJsonSchemaNodeData, JsonSchemaNodeKind> {
  
  public createJsonSchemaNode(id: string, kind: JsonSchemaNodeKind, key: string | number, value: JsonSchemaFragment, parent: JsonSchemaTreeNode | null = null): JsonSchemaNode {
    if (isOneOfNode(value)) {
      return this.createComplexNode(id, kind, key, "oneOf", parent)
    } else if (isAnyOfNode(value)) {
      return this.createComplexNode(id, kind, key, "anyOf", parent)
    } else {
      return this.createNode(id, kind, key, new JsonSchemaNodeData(value), parent)
    }
  }

  public load(schema: JsonSchemaFragment, source: any = schema) {
    this.nodes.clear()
    
    const data = merge(schema, { source, mergeRefSibling: true, mergeCombinarySibling: true })

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
        if (this.nodes.has(value.$ref)) {
          const cache = this.nodes.get(value.$ref)!
          if (container) {
            container.addNestedNode(cache)
          } else if (parent) {
            this.createRefNode(id, kind, ctx.key, cache, parent)
          }
          
          return null
        } else {
          // resolve and create node in cache
          refData = resolveRefNode(source, value)
          const { normalized } = parseRef(value.$ref)

          const node = this.createJsonSchemaNode(normalized, "definition", "", refData)

          if (container) {
            container.addNestedNode(node)
          } else if (parent) {
            this.createRefNode(id, kind, ctx.key, node, parent)
          }

          const state = isComplexNode(node) ? { parent, container: node as JsonSchemaComplexNode } : { parent: node as JsonSchemaTreeNode }
          return { value: refData, state }
        } 
      } 
        
      const node = this.createJsonSchemaNode(id, kind, ctx.key, value as JsonSchemaFragment, parent)
      
      if (container) {
        container.addNestedNode(node)
      } else {
        parent?.addChild(node)
      }
      const state = isComplexNode(node) ? { parent, container: node as JsonSchemaComplexNode } : { parent: node as JsonSchemaTreeNode }
      return { value, state }
    }, { state: crawlState, rules: jsonSchemaCrawlRules() })
  }
}
