import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { 
  createOpenApiContentNode, createOpenApiOperationNode, createOpenApiParamNode, 
  createOpenApiResponseNode, createOpenApiServiceNode
} from './openapi.node'
import { OpenApiComplexNode, OpenApiCrawlRule, OpenApiCrawlState, OpenApiModelTree, OpenApiTreeNode } from './openapi.types'
import { openApiNodeKindMetaKeys, openApiSpecificNodeKind, openApiSpecificNodeKinds } from './openapi.consts'
import { createJsonSchemaTreeCrawlHook } from '../jsonSchema'
import { getTargetNode, isObject, pick } from '../utils'
import { createTransformCrawlHook } from '../transform'
import { JsonSchemaModelTree } from '../jsonSchema'
import { openApiCrawlRules } from "./openapi.rules"

const createOpenApiTreeCrawlHook = (tree: OpenApiModelTree): SyncCrawlHook<OpenApiCrawlState, OpenApiCrawlRule> => {
  return ({ rules, value, path, key, state }) => {
    if (!rules) { return { done: true } }
    if (!("kind" in rules) || !(openApiSpecificNodeKinds.includes(rules.kind)) || !isObject(value)) { 
      return
    }

    const id = "#" + buildPointer(path)
    const { parent, container, source } = state
    const { kind } = rules
 
    let res: any = { node: null, value }
    switch (kind) {
      case openApiSpecificNodeKind.requestBody: {
        const meta = { ...pick(value, openApiNodeKindMetaKeys.requestBody), _fragment: value }
        res.node = tree.createComplexNode(id, kind, key, { type: "oneOf", parent, meta })
        break
      }
      case openApiSpecificNodeKind.response: {
        res.node = tree.createComplexNode(id, kind, key, { type: "oneOf", parent, meta: { _fragment: value }})
        break
      }
      case openApiSpecificNodeKind.responseBody: {
        const meta = { ...pick(value, openApiNodeKindMetaKeys.requestBody), _fragment: value }
        res.node = tree.createComplexNode(id, kind, key, { type: "oneOf", parent, meta })
        break
      }
      case openApiSpecificNodeKind.parameter:
      case openApiSpecificNodeKind.header:
        res = createOpenApiParamNode(tree, id, kind, String(key), value as any, source, parent)
        break
      case openApiSpecificNodeKind.oneOfContent:
        res = createOpenApiContentNode(tree, id, value, source, parent)
        break
      case openApiSpecificNodeKind.operation:
        res = createOpenApiOperationNode(tree, id, path, value, parent)
        break
      case openApiSpecificNodeKind.service:
        res = createOpenApiServiceNode(tree, value)
        break
      case openApiSpecificNodeKind.oneOfResponse:
        res = createOpenApiResponseNode(tree, id, String(key), value, source, parent)
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
      const state = res.node.type !== "oneOf" 
        ? { parent: _node as OpenApiTreeNode, source }
        : { parent, container: _node as OpenApiComplexNode, source }
      return { value: res.value, state }
    } else {
      return { done: true }
    }
  }
}

export const createOpenApiTree = (schema: any) => {
  const tree: OpenApiModelTree = new JsonSchemaModelTree(schema)
  const crawlState: OpenApiCrawlState  = { parent: null, source: schema }

  syncCrawl<OpenApiCrawlState, OpenApiCrawlRule>(
    schema,
    [
      createTransformCrawlHook(schema),
      createOpenApiTreeCrawlHook(tree),
      createJsonSchemaTreeCrawlHook(tree as JsonSchemaModelTree) as SyncCrawlHook<any, any>
    ], 
    { state: crawlState, rules: openApiCrawlRules }
  )

  return tree
}
