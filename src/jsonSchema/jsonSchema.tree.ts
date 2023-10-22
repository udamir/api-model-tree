import { isRefNode, parseRef, resolveRefNode } from "allof-merge"

import { JsonSchemaNodeValue, JsonSchemaFragment, JsonSchemaNodeKind, JsonSchemaNodeMeta } from "./jsonSchema.types"
import { jsonSchemaNodeMetaProps, jsonSchemaNodeValueProps } from "./jsonSchema.consts"
import { isValidType, transformTitle, isRequired } from "./jsonSchema.utils"
import { CreateNodeResult, IModelTreeNode, ModelDataNode } from "../types"
import { getNodeComplexityType, pick } from "../utils"
import { modelTreeNodeType } from "../consts"
import { ModelTree } from "../modelTree"

export class JsonSchemaModelTree<
  T = JsonSchemaNodeValue,
  K extends string = JsonSchemaNodeKind,
  M extends JsonSchemaNodeMeta = JsonSchemaNodeMeta
> extends ModelTree<T, K, M> {
  public nodes: Map<string, ModelDataNode<T, K, M>> = new Map()

  constructor(public source: any) {
    super()
  }

  public createNodeMeta (key: string | number, value: any, parent: ModelDataNode<T, K, M> | null = null): M {
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


  public createNodeValue(value: any): T {
    const { type = "any" } = value
    if (Array.isArray(type) || !type || typeof type !== "string" || !isValidType(type)) {
      throw new Error(`Schema should have correct type!`)
    }
    const _value = pick<any>(value, jsonSchemaNodeValueProps[type])

    return _value as T
  }

  public createJsonSchemaNode (
    id: string,
    kind: K,
    key: string | number,
    value: JsonSchemaFragment | null,
    parent: ModelDataNode<T, K, M> | null = null
  ): CreateNodeResult<ModelDataNode<T, K, M>> {
    const required = isRequired(key, parent)
  
    if (value === null) {
      return { node: this.createNode(id, kind, key, { parent, meta: this.createNodeMeta(key, parent) }), value: null }
    }
  
    let res = { value: value, node: {} } as CreateNodeResult<ModelDataNode<T, K, M>>
  
    const complexityType = getNodeComplexityType(value)
    if (complexityType !== modelTreeNodeType.simple) {
      const params = { type: complexityType, parent, meta: this.createNodeMeta(key, value, parent) }
      res.node = this.createComplexNode(id, kind, key, params)
    } else if (isRefNode(value)) {
      const { normalized } = parseRef(value.$ref)
      if (this.nodes.has(normalized)) {
        res.value = null
        res.node = this.nodes.get(normalized)!
      } else {
        // resolve and create node in cache
        const _value = transformTitle(resolveRefNode(this.source, value), normalized) ?? null
        res = this.createJsonSchemaNode(normalized, "definition" as K, "", _value)
      }
  
      const params = { parent, meta: this.createNodeMeta(key, value, parent) }
      res.node = this.createRefNode(id, kind, key, res.node ?? null, params)
    } else {  
      res.node = this.createNode(id, kind, key, { 
        value: this.createNodeValue(value),
        meta: this.createNodeMeta(key, value, parent),
        parent
      })
    }
  
    return res
  }
  
  public createNestedNode(id: string, kind: K, key: string | number, value: any, container: any) {
    const res = this.createJsonSchemaNode(id, kind, key, value, container.parent)
    container.addNestedNode(res.node)
    return res
  }

  public createChildNode(id: string, kind: K, key: string | number, value: any, parent: any) {
    const res = this.createJsonSchemaNode(id, kind, key, value, parent)
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
