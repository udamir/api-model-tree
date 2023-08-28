import { buildPointer, isAnyOfNode, isOneOfNode, isRefNode, merge, parseRef, resolveRefNode } from "allof-merge";
import type { JSONSchema4, JSONSchema6 } from 'json-schema';
import { syncCrawl } from 'json-crawl';

import { CrawlState, IJsonNodeData, JsonSchemaNode, ParentType } from "./types";
import { jsonSchemaCrawlRules } from "./rules";
import { JsonNodeData } from "./jsonNodeData";
import { DimTree } from "./dimTree";

export class JsonSchemaTree extends DimTree<IJsonNodeData> {

  public load(schema: JSONSchema6 | JSONSchema4, source: any = schema) {
    this.nodes.clear()
    
    const data = merge(schema, { mergeRefSibling: true, mergeCombinarySibling: true })

    const crawlState: CrawlState = { parent: null, parentType: 'simple' }

    syncCrawl(data, (value, ctx) => {
      if (!ctx.rules) { return null }
      if (!("node" in ctx.rules)) { return { value, state: ctx.state } }

      let node: JsonSchemaNode
      const id = "#" + buildPointer(ctx.path)
      const { parent, parentType } = ctx.state
      const dimension = parentType === 'simple' ? "" : parentType
      const _type: ParentType = isAnyOfNode(value) ? 'anyOf' : isOneOfNode(value) ? 'oneOf' : 'simple'

      if (isRefNode(value)) {
        // check if sycle node
        const isCycle = false

        // check if node in cache
        if (!this.nodes.has(value.$ref)) {
          // resolve and create node
          const refData = resolveRefNode(source, value)
          const { pointer: refId } = parseRef(value.$ref)

          node = this.createNode(parent, refId, _type, new JsonNodeData(refData), dimension)
        } else {
          const cache = this.nodes.get(value.$ref)!
          this.createRefNode(parent!, id, cache, isCycle, dimension)
          return null
        }
      } else {
        node = this.createNode(parent, id, _type, new JsonNodeData(value as any), dimension)
      }

      return { value, state: { parent: node, parentType: _type } }
    }, { state: crawlState, rules: jsonSchemaCrawlRules })
  }
}
