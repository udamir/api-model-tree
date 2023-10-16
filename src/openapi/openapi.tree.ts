import { CrawlContext, SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer, isRefNode } from "allof-merge"

import { crawlJsonSchemaRefNode, createJsonSchemaNode, createJsonSchemaTreeCrawlHook } from '../jsonSchema'
import { openApiNodeKindValueKeys, openApiSpecificNodeKind, openApiSpecificNodeKinds } from './openapi.consts'
import { OpenApiCrawlRule, OpenApiCrawlState, OpenApiModelTree, OpenApiNodeKind } from './openapi.types'
import { createOpenApiParamCrawlHook } from './nodes/parameter'
import { createOpenApiContentCrawlHook } from './nodes/content'
import { JsonSchemaModelTree } from '../jsonSchema'
import { openApiCrawlRules } from "./openapi.rules"
import { transformCrawlHook } from '../transform'
import { ModelTree } from "../modelTree"
import { pick } from '../utils'

const getNodeValue = (kind: OpenApiNodeKind, value: any, ctx: CrawlContext<OpenApiCrawlState, OpenApiCrawlRule> ) => {
  switch (kind) {
    case 'service':
      return {
        ...pick(value, openApiNodeKindValueKeys[kind]),
        ...value?.components?.securitySchemes ? value.components.securitySchemes : {}
      }
    case 'operation': 
      return {
        ...pick(value, openApiNodeKindValueKeys[kind]),
        path: ctx.path[1],
        method: ctx.path[2]
      }
    default:
      break;
  }
}

/**
 * service [simple]
 *   - operation [simple]
 *     - parameter (schema)
 *     - requestBody [oneOf]
 *       = oneOfcontent (schema)
 *     - response [oneOf]
 *       = oneOfresponse [simple]
 *         - header (schema)
 *         - responseBody [oneOf]
 *           = oneOfcontent (schema)
 *           
 */

const createOpenApiTreeCrawlHook = (tree: ModelTree<any, any, any>): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !(openApiSpecificNodeKinds.includes(ctx.rules.kind)) || ctx.rules.kind === 'parameter') { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, container, source } = ctx.state
    const { kind } = ctx.rules
 
    let node
    if (kind === openApiSpecificNodeKind.responses || kind === openApiSpecificNodeKind.requestBody || kind === openApiSpecificNodeKind.oneOfResponse ) {
      node = tree.createComplexNode(id, kind, ctx.key, { 
        type: "oneOf", 
        parent, 
        meta: { _fragment: value }
      })
    } else if (kind === openApiSpecificNodeKind.response || kind === openApiSpecificNodeKind.body || kind === openApiSpecificNodeKind.parameter) {
      if (isRefNode(value)) {
        return crawlJsonSchemaRefNode(tree, value.$ref, ctx)
      } 
      node = createJsonSchemaNode(tree as JsonSchemaModelTree, id, kind, ctx.key, value as any, parent)
      node.meta
    } else {
      const params = {
        value: getNodeValue(kind, value, ctx),
        parent,
        meta: { _fragment: value },
      }
      node = tree.createNode(id, kind, ctx.key, params)
    }

    if (container) {
      container.addNestedNode(node)
    } else {
      parent?.addChild(node)
    }

    const state = node.type !== "oneOf" ? { parent: node, source } : { parent, container: node, source }
    return { value, state }
  }
}


export const createOpenApiTree = (schema: any) => {
  const tree: OpenApiModelTree = new ModelTree()
  const crawlState: OpenApiCrawlState  = { parent: null, source: schema }

  syncCrawl(
    schema,
    [
      transformCrawlHook,
      createOpenApiTreeCrawlHook(tree),
      createOpenApiParamCrawlHook(tree),
      createOpenApiContentCrawlHook(tree),
      createJsonSchemaTreeCrawlHook(tree as JsonSchemaModelTree)
    ], 
    { state: crawlState, rules: openApiCrawlRules }
  )

  return tree
}
