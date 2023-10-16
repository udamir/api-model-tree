import { buildPointer, isRefNode, parseRef, resolveRefNode } from "allof-merge"
import { SyncCrawlHook } from "json-crawl"

import { JsonSchemaModelTree, createJsonSchemaNode, jsonSchemaNodeMetaProps } from "../../jsonSchema"
import { CreateNodeResult, HttpOperationNode, IParameterMeta, OpenApiParameterNode } from "./types"
import { OpenApiNodeKind, OpenApiNodeMeta, OpenApiNodeValue } from "../openapi.types"
import { getTargetNode, pick } from "../../utils"
import { modelTreeNodeType } from "../../consts"
import { ModelTree } from "../../modelTree"


export const createOpenApiParamNode = (
  tree: ModelTree<OpenApiNodeValue, OpenApiNodeKind, OpenApiNodeMeta>,
  id: string,
  kind: 'parameter' | 'definition',
  _parameter: any, 
  source: any,
  parent: HttpOperationNode | null = null 
): CreateNodeResult => {
  const { name: key = "", schema = {} } = _parameter

  const meta: IParameterMeta = {
    ...pick<any>(schema, jsonSchemaNodeMetaProps),
    ...pick(_parameter, ['in', 'description', 'required', 'deprecated', 'allowEmptyValue']),
    _fragment: _parameter
  } 

  const res = createJsonSchemaNode(tree as JsonSchemaModelTree, `${id}/schema`, 'definition', key, schema, source)

  const node = tree.createRefNode(id, kind, key, res.node ?? null, { parent, meta }) as OpenApiParameterNode
  return { value: res.value, node }
}

export const createOpenApiParamCrawlHook = (tree: ModelTree<any, any, any>): SyncCrawlHook => {
  return (value: unknown, ctx) => {
    if (!ctx.rules || !value || typeof value !== 'object' || Array.isArray(value)) { return null }
    if (!("kind" in ctx.rules) || ctx.rules.kind !== 'parameter' || ctx.rules.kind !== 'header') { 
      return { value, state: ctx.state }
    }

    const { parent, source } = ctx.state
    const { kind } = ctx.rules
    const id = "#" + buildPointer(ctx.path)

    let res: any = { value, node: null }
    if (isRefNode(value)) {
      const { normalized } = parseRef(value.$ref)
      if (tree.nodes.has(normalized)) {
        res.value = null
        res.node = tree.nodes.get(normalized)!
      } else {
        const _param = resolveRefNode(source, value)
        res = createOpenApiParamNode(tree, normalized, 'definition', '', _param, source)
      }

      const params = { parent, ...res.node ? { meta: res.node.meta } : {}}
      res.node = tree.createRefNode(id, kind, kind === 'header' ? ctx.key : value.name, res.node ?? null, params)
    } else {
      res = createOpenApiParamNode(tree, id, kind, { name: ctx.key, ...value }, source, parent)
    }
    
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
