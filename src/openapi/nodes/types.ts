import { JsonSchemaNodeMeta, JsonSchemaNodeValue } from "../../jsonSchema"
import { OpenApiTreeNode } from "../openapi.types"
import { ModelDataNode } from "../../types"

export interface IParameterMeta extends JsonSchemaNodeMeta {
  in?: string
  description?: string
  allowEmptyValue?: boolean
}

export interface IContentMeta extends JsonSchemaNodeMeta {
  encoding?: any
  examples?: any
  example?: any
}

export type OpenApiParameterNode = ModelDataNode<JsonSchemaNodeValue, 'parameter', IParameterMeta>

export interface CreateNodeResult {
  value: any | null
  node: OpenApiTreeNode
}

export type HttpOperationNode = any
