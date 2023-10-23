import { GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta } from "./graphSchema.types"
import { JsonSchemaCreateNodeParams, JsonSchemaModelTree, isRequired } from "../jsonSchema"
import { graphSchemaNodeMetaProps, graphSchemaNodeValueProps } from "./graphSchema.consts"
import { CreateNodeResult, ModelDataNode } from "../types"
import { getNodeComplexityType, pick } from "../utils"

export class GraphSchemaModelTree<
  T = GraphSchemaNodeValue,
  K extends string = GraphSchemaNodeKind,
  M extends object = GraphSchemaNodeMeta
> extends JsonSchemaModelTree<T, K, M> {

  public createNodeMeta (params: JsonSchemaCreateNodeParams<T, K, M>): M {
    const { value, key = "", parent = null } = params
    const required = isRequired(key, parent)

    const complexityType = getNodeComplexityType(value)
    if (complexityType === "simple") {
      return {
        ...pick<any>(value, graphSchemaNodeMetaProps),
        required,
        _fragment: value
      } as M
    } else {
      return { required, _fragment: value } as M
    }
  } 

  public createNodeValue(params: JsonSchemaCreateNodeParams<T, K, M>): T {
    const { value, id } = params
    const { type } = value
    if (!type || typeof type !== 'string') { 
      throw new Error (`Schema should have type: ${id}`)
    }
    const _value = pick<any>(value, graphSchemaNodeValueProps[type])

    return _value as T
  }
  
  public createGraphSchemaNode (
    params: JsonSchemaCreateNodeParams<T, K, M>
  ): CreateNodeResult<ModelDataNode<T, K, M>> {
    return this.createJsonSchemaNode(params)
  }
}
