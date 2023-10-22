import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { createOpenApiContentNode, createOpenApiOperationNode, createOpenApiParamNode, createOpenApiResponseNode, createOpenApiServiceNode } from './openapi.node'
import { openApiNodeKindMetaKeys, openApiSpecificNodeKind, openApiSpecificNodeKinds } from './openapi.consts'
import { OpenApiCrawlState, OpenApiModelTree } from './openapi.types'
import { createJsonSchemaTreeCrawlHook } from '../jsonSchema'
import { getTargetNode, isObject, pick } from '../utils'
import { createTransformCrawlHook } from '../transform'
import { JsonSchemaModelTree } from '../jsonSchema'
import { openApiCrawlRules } from "./openapi.rules"

const createOpenApiTreeCrawlHook = (tree: OpenApiModelTree): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !(openApiSpecificNodeKinds.includes(ctx.rules.kind)) || !isObject(value)) { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent, container, source } = ctx.state
    const { kind } = ctx.rules
 
    let res: any = { node: null, value }
    switch (kind) {
      case openApiSpecificNodeKind.requestBody: {
        const meta = { ...pick(value, openApiNodeKindMetaKeys.requestBody), _fragment: value }
        res.node = tree.createComplexNode(id, kind, ctx.key, { type: "oneOf", parent, meta })
        break
      }
      case openApiSpecificNodeKind.response: {
        res.node = tree.createComplexNode(id, kind, ctx.key, { type: "oneOf", parent, meta: { _fragment: value }})
        break
      }
      case openApiSpecificNodeKind.responseBody: {
        const meta = { ...pick(value, openApiNodeKindMetaKeys.requestBody), _fragment: value }
        res.node = tree.createComplexNode(id, kind, ctx.key, { type: "oneOf", parent, meta })
        break
      }
      case openApiSpecificNodeKind.parameter:
      case openApiSpecificNodeKind.header:
        res = createOpenApiParamNode(tree, id, kind, String(ctx.key), value as any, source, parent)
        break
      case openApiSpecificNodeKind.oneOfContent:
        res = createOpenApiContentNode(tree, id, value, source, parent)
        break
      case openApiSpecificNodeKind.operation:
        res = createOpenApiOperationNode(tree, id, ctx.path, value, parent)
        break
      case openApiSpecificNodeKind.service:
        res = createOpenApiServiceNode(tree, value)
        break
      case openApiSpecificNodeKind.oneOfResponse:
        res = createOpenApiResponseNode(tree, id, String(ctx.key), value, source, parent)
        break
      default:
        throw new Error('unknown kind')
    }

    if (container) {
      container.addNestedNode(res.node)
    } else {
      parent?.addChild(res.node)
    }

    if (res.value) {
      const _node = getTargetNode(tree, res.node)
      const state = res.node.type !== "oneOf" ? { parent: _node, source } : { parent, container: _node, source }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}

export const createOpenApiTree = (schema: any) => {
  const tree: OpenApiModelTree = new JsonSchemaModelTree(schema)
  const crawlState: OpenApiCrawlState  = { parent: null, source: schema }

  syncCrawl(
    schema,
    [
      createTransformCrawlHook(schema),
      createOpenApiTreeCrawlHook(tree),
      createJsonSchemaTreeCrawlHook(tree as JsonSchemaModelTree)
    ], 
    { state: crawlState, rules: openApiCrawlRules }
  )

  return tree
}
