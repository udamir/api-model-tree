import { isRefNode, parseRef, resolveRefNode } from "allof-merge"

import { JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta, JsonSchemaCreateNodeParams } from "./jsonSchema.types"
import { jsonSchemaNodeMetaProps, jsonSchemaNodeValueProps } from "./jsonSchema.consts"
import { isValidType, transformTitle, isRequired } from "./jsonSchema.utils"
import { CreateNodeResult, IModelTreeNode, ModelDataNode } from "../types"
import { getNodeComplexityType, pick } from "../utils"
import { modelTreeNodeType } from "../consts"
import { ModelTree } from "../modelTree"

export class JsonSchemaModelTree<
  T = JsonSchemaNodeValue,
  K extends string = JsonSchemaNodeKind,
  M extends object = JsonSchemaNodeMeta
> extends ModelTree<T, K, M> {
  public nodes: Map<string, ModelDataNode<T, K, M>> = new Map()

  constructor(public source: any) {
    super()
  }

  public createNodeMeta (params: JsonSchemaCreateNodeParams<T, K, M>): M {
    const { value, key = "", parent = null } = params
    const required = isRequired(key, parent)

    const complexityType = getNodeComplexityType(value)
    if (complexityType === "simple") {
      return {
        ...pick<any>(value, jsonSchemaNodeMetaProps),
        required,
        _fragment: value,
      } as M
    } else {
      return { 
        required,
        _fragment: value 
      } as M
    }
  } 


  public createNodeValue(params: JsonSchemaCreateNodeParams<T, K, M>): T {
    const { value, id } = params
    const { type = "any" } = value
    if (Array.isArray(type) || !type || typeof type !== "string" || !isValidType(type)) {
      throw new Error(`Schema should have correct type: ${id}`)
    }
    const _value = pick<any>(value, jsonSchemaNodeValueProps[type])

    return _value as T
  }

  public createJsonSchemaNode (params: JsonSchemaCreateNodeParams<T, K, M>): CreateNodeResult<ModelDataNode<T, K, M>> {
    const { id, kind, key = "", value, parent = null, countInDepth = true } = params
  
    if (value === null) {
      return { node: this.createNode(id, kind, key, { parent, meta: this.createNodeMeta(params), countInDepth }), value: null }
    }
  
    let res = { value: value, node: {} } as CreateNodeResult<ModelDataNode<T, K, M>>
  
    const complexityType = getNodeComplexityType(value)
    if (complexityType !== modelTreeNodeType.simple) {
      const _params = { type: complexityType, parent, meta: this.createNodeMeta(params), countInDepth }
      res.node = this.createComplexNode(id, kind, key, _params)
    } else if (isRefNode(value)) {
      const { normalized } = parseRef(value.$ref)
      if (this.nodes.has(normalized)) {
        res.value = null
        res.node = this.nodes.get(normalized)!
      } else {
        // resolve and create node in cache
        const _value = transformTitle(resolveRefNode(this.source, value), normalized) ?? null
        res = this.createJsonSchemaNode({ id: normalized, kind: "definition" as K, value: _value })
      }
  
      const _params = { parent, meta: this.createNodeMeta(params), countInDepth }
      res.node = this.createRefNode(id, kind, key, res.node ?? null, _params)
    } else {  
      res.node = this.createNode(id, kind, key, { 
        value: this.createNodeValue(params),
        meta: this.createNodeMeta(params),
        parent,
        countInDepth
      })
    }
  
    return res
  }
  
  public createNestedNode(id: string, kind: K, key: string | number, value: any, container: any) {
    const res = this.createJsonSchemaNode({ id, kind, key, value, container, parent: container.parent })
    container.addNestedNode(res.node)
    return res
  }

  public createChildNode(id: string, kind: K, key: string | number, value: any, parent: any) {
    const res = this.createJsonSchemaNode({ id, kind, key, value, parent })
    parent?.addChild(res.node)
    return res
  }

  public getTargetNode (node: ModelDataNode<T, K, M>): IModelTreeNode<T, K, M> | null {
    if (typeof node === 'object' && node && 'ref' in node) {
      const _node = this.nodes.get(node.ref)
      if (_node) {
        return this.getTargetNode(_node)
      } else {
        return null
      }  
    }
    return node
  }
}
