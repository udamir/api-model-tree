import { buildPointer, isAnyOfNode, isOneOfNode, isRefNode, merge, parseRef, resolveRefNode } from "allof-merge"
import type { JSONSchema4, JSONSchema6 } from 'json-schema'
import { syncCrawl } from 'json-crawl'

import { CrawlState, IJsonNodeData, JsonSchemaNode } from "./types"
import { ModelTree, ModelTreeComplexNode } from "./modelTree"
import { jsonSchemaCrawlRules } from "./rules"
import { JsonNodeData } from "./jsonNodeData"

export class JsonSchemaTree extends ModelTree<IJsonNodeData> {

  public load(schema: JSONSchema6 | JSONSchema4, source: any = schema) {
    this.nodes.clear()
    
    const data = merge(schema, { source, mergeRefSibling: true, mergeCombinarySibling: true })

    const crawlState: CrawlState = { parent: null }

    syncCrawl(data, (value, ctx) => {
      if (!ctx.rules) { return null }
      if (!("node" in ctx.rules) || Array.isArray(value)) { return { value, state: ctx.state } }

      let node: JsonSchemaNode
      const id = "#" + buildPointer(ctx.path)
      const { parent, container } = ctx.state

      if (isRefNode(value)) {
        // check if sycle node
        const isCycle = false

        // check if node in cache
        if (!this.nodes.has(value.$ref)) {
          // resolve and create node in cache
          const refData = resolveRefNode(source, value)
          const { normalized } = parseRef(value.$ref)

          this.createNode(normalized, "definition", "", new JsonNodeData(refData))
        } 

        const cache = this.nodes.get(value.$ref)!
        if (container) {
          container.addNestedNode(cache)
        } else if (parent) {
          this.createRefNode(id, ctx.rules.node, ctx.key, cache, isCycle, parent)
        }
        return null
      
      } else if (isOneOfNode(value)) {
        node = this.createComplexNode(id, ctx.rules.node, ctx.key, "oneOf", parent)
      } else if (isAnyOfNode(value)) {
        node = this.createComplexNode(id, ctx.rules.node, ctx.key, "anyOf", parent)
      } else {
        node = this.createNode(id, ctx.rules.node, ctx.key, new JsonNodeData(value as any), parent)
      }

      if (container) {
        container.addNestedNode(node)
      } else {
        parent?.addChild(node)
      }

      return { value, state: node instanceof ModelTreeComplexNode ? { parent, container: node } : { parent: node } }
    }, { state: crawlState, rules: jsonSchemaCrawlRules() })
  }
}
