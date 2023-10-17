import { isRefNode, parseRef, resolveRefNode } from "allof-merge"
import { JsonPath } from "json-crawl"

import { 
  OpenApiOperationNode, IParameterMeta, OpenApiParameterNode, IContentMeta, 
  IOperationNodeMeta, OpenApiServiceNode, OpenApiModelTree, OpenApiContentNode
} from "./openapi.types"
import { JsonSchemaModelTree, createJsonSchemaNode, jsonSchemaNodeMetaProps } from "../jsonSchema"
import { openApiNodeKindValueKeys } from "./openapi.consts"
import { CreateNodeResult } from "../types"
import { pick } from "../utils"

export const createOpenApiParamSchemaNode = (
  tree: OpenApiModelTree,
  id: string,
  kind: 'parameter' | 'definition' | 'header',
  _parameter: any, 
  source: any,
  parent: OpenApiOperationNode | null = null 
): CreateNodeResult<OpenApiParameterNode> => {
  const { name: key = "", schema = {} } = _parameter

  const meta: IParameterMeta = {
    ...pick<any>(schema, jsonSchemaNodeMetaProps),
    ...pick(_parameter, ['in', 'description', 'required', 'deprecated', 'allowEmptyValue']),
    _fragment: _parameter
  } 

  const res = createJsonSchemaNode(tree as JsonSchemaModelTree, `${id}/schema`, 'definition', key, schema, source)

  const node = tree.createRefNode(id, kind, key, res.node, { parent, meta }) as OpenApiParameterNode
  return { value: res.value, node }
}

export const createOpenApiParamNode = (
  tree: OpenApiModelTree,
  id: string,
  kind: 'parameter' | 'definition' | 'header',
  key: string,
  _parameter: any, 
  source: any,
  parent: OpenApiOperationNode | null = null 
): CreateNodeResult<OpenApiParameterNode> => {
  let res: CreateNodeResult<OpenApiParameterNode> = { value: _parameter, node: null as any }
  if (isRefNode(_parameter)) {
    const { normalized } = parseRef(_parameter.$ref)
    if (tree.nodes.has(normalized)) {
      res.value = null
      res.node = tree.nodes.get(normalized)! as OpenApiParameterNode
    } else {
      const _param = resolveRefNode(source, _parameter)
      res = createOpenApiParamSchemaNode(tree, normalized, 'definition', '', _param, source)
    }

    const params = { parent, ...res.node ? { meta: res.node.meta } : {}}
    res.node = tree.createRefNode(id, kind, kind === 'header' ? key : res.node.key, res.node ?? null, params) as OpenApiParameterNode
  } else {
    res = createOpenApiParamSchemaNode(tree, id, kind, { name: key, ..._parameter }, source, parent)
  }
    
  return res
}

export const createOpenApiContentNode = (
  tree: OpenApiModelTree,
  id: string,
  _content: any, 
  source: any,
  parent: OpenApiOperationNode | null = null 
): CreateNodeResult<OpenApiContentNode> => {
  const { schema = {} } = _content

  const meta: IContentMeta = {
    ...pick<any>(schema, jsonSchemaNodeMetaProps),
    ...pick(_content, ['example', 'examples', 'encoding']),
    _fragment: _content
  } 

  const res = createJsonSchemaNode(tree as JsonSchemaModelTree, `${id}/schema`, 'definition', 'body', schema, source)
  
  const node = tree.createRefNode(id, 'oneOfContent', '', res.node ?? null, { parent, meta }) as OpenApiContentNode
  return { value: res.value, node }
}

export const createOpenApiOperationNode = (
  tree: OpenApiModelTree,
  id: string,
  path: JsonPath,
  _operation: any, 
  parent: OpenApiServiceNode | null = null 
): CreateNodeResult<OpenApiOperationNode> => {

  const meta: IOperationNodeMeta = {
    ...pick(_operation, openApiNodeKindValueKeys.operation),
    path: String(path[1]),
    method: String(path[2]),
    _fragment: _operation
  } 

  return { 
    value: _operation,
    node: tree.createNode(id, 'operation', `${meta.path}~1${meta.method}`, { parent, meta }) as OpenApiOperationNode
  }
}
