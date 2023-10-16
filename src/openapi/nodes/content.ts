import { SyncCrawlHook } from "json-crawl"
import { buildPointer } from "allof-merge"

import { JsonSchemaModelTree, createJsonSchemaNode, jsonSchemaNodeMetaProps } from "../../jsonSchema"
import { CreateNodeResult, HttpOperationNode, IContentMeta, OpenApiParameterNode } from "./types"
import { OpenApiNodeKind, OpenApiNodeMeta, OpenApiNodeValue } from "../openapi.types"
import { getTargetNode, pick } from "../../utils"
import { modelTreeNodeType } from "../../consts"
import { ModelTree } from "../../modelTree"

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

  const res = createJsonSchemaNode(tree as JsonSchemaModelTree, `${id}/schema`, 'definition', 'body', schema, source)
  
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
      const _node = getTargetNode(tree, res.node)
      const state = res.node.type === modelTreeNodeType.simple 
        ? { parent: _node, source }
        : { parent, container: _node, source }
      return { value: res.value, state }
    } else {
      return null
    }
  }
}
