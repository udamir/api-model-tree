import { buildPointer, isRefNode, parseRef, resolveRefNode } from "allof-merge"

import { JsonSchemaModelTree, createJsonSchemaNode, jsonSchemaNodeMetaProps } from "../../jsonSchema"
import { CreateNodeResult, HttpOperationNode, IContentMeta, OpenApiParameterNode } from "./types"
import { OpenApiNodeKind, OpenApiNodeMeta, OpenApiNodeValue } from "../openapi.types"
import { modelTreeNodeType } from "../../consts"
import { ModelTree } from "../../modelTree"
import { SyncCrawlHook } from "json-crawl"
import { pick } from "../../utils"

export const createOpenApiContentNode = (
  tree: ModelTree<OpenApiNodeValue, OpenApiNodeKind, OpenApiNodeMeta>,
  id: string,
  _content: any, 
  source: any,
  parent: HttpOperationNode | null = null 
): CreateNodeResult => {
  const { schema = {} } = _content

  const meta: IContentMeta = {
    ...pick<any>(schema, jsonSchemaNodeMetaProps),
    ...pick(_content, ['example', 'examples', 'encoding']),
    _fragment: _content
  } 

  const res: any = { value: schema, node: null }
  if (isRefNode(schema)) {
    const { normalized } = parseRef(schema.$ref)
    if (tree.nodes.has(normalized)) {
      res.value = null
      res.node = tree.nodes.get(normalized)!
    } else {
      res.value = resolveRefNode(source, schema)
      res.node = createJsonSchemaNode(tree as JsonSchemaModelTree, normalized, 'definition', '', res.value)
    }
  } else {
    res.node = createJsonSchemaNode(tree as JsonSchemaModelTree, `${id}/schema`, 'definition', '', schema, parent)
  }
  
  const node = tree.createRefNode(id, 'oneOfContent', '', res.node ?? null, { parent, meta }) as OpenApiParameterNode
  return { value: res.value, node }
}

export const createOpenApiContentCrawlHook = (tree: ModelTree<any, any, any>): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || ctx.rules.kind !== 'oneOfContent') { 
      return { value, state: ctx.state }
    }

    const { parent, source } = ctx.state
    const id = "#" + buildPointer(ctx.path)

    const res = createOpenApiContentNode(tree, id, value, source, parent)
    
    parent?.addChild(res.node)

    if (res.value) {
      const state = res.node.type === modelTreeNodeType.simple 
        ? { parent: res.node, source }
        : { parent, container: res.node as any, source }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}
