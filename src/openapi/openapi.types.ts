import { OpenAPIV3 } from "openapi-types"
import { JsonPath } from 'json-crawl'

import { JsonSchemaComplexNode, JsonSchemaModelTree, JsonSchemaNode, JsonSchemaNodeMeta, JsonSchemaNodeValue } from '../jsonSchema'
import type { IModelTreeNode, ModelDataNode, SchemaCrawlRule } from '../types'
import { ModelTreeComplexNode } from '../modelTree'
import { openApiNodeKind } from './openapi.consts'

export type OpenApiNodeKind = keyof typeof openApiNodeKind

export interface OpenApiTransformFuncContext {
  source: unknown
  path: JsonPath
}

export interface OpenApiCrawlState {
  parent: OpenApiTreeNode | null
  container?: OpenApiComplexNode | null
  source: unknown
}

export type OpenApiOperationsFilter = (node: OpenApiTreeNode) => boolean

export type OpenApiCrawlRule = SchemaCrawlRule<OpenApiNodeKind, OpenApiCrawlState>

export type OpenApiServiceNode = IModelTreeNode<null, 'service', IServiceNodeMeta>
export type OpenApiOperationNode = IModelTreeNode<null, 'operation', IOperationNodeMeta>
export type OpenApiParameterNode = ModelDataNode<JsonSchemaNodeValue, 'parameter' | 'header', IParameterMeta>
export type OpenApiContentNode = ModelDataNode<JsonSchemaNodeValue, 'oneOfContent', IContentMeta>
export type OpenApiResponseNode = ModelTreeComplexNode<null, 'oneOf', IResponseMeta>
export type OpenApiResponseBodyNode = ModelTreeComplexNode<null, 'oneOf', IResponseBodyMeta>
export type OpenApiRequestBodyNode = ModelTreeComplexNode<null, 'oneOf', IRequestBodyMeta>

export type OpenApiTreeNode<T extends OpenApiNodeKind = any> = 
  T extends 'service' ? OpenApiServiceNode :
  T extends 'operation' ? OpenApiOperationNode :
  T extends 'parameter' | 'header' ? OpenApiParameterNode :
  T extends 'oneOfContent' ? OpenApiContentNode : JsonSchemaNode

export type OpenApiComplexNode<T extends OpenApiNodeKind = any> = 
  T extends 'response' ? OpenApiResponseNode :
  T extends 'responseBody' ? OpenApiResponseBodyNode :
  T extends 'requestBody' ? OpenApiRequestBodyNode : JsonSchemaComplexNode

export type OpenApiNodeMeta = IServiceNodeMeta | IOperationNodeMeta | IParameterMeta | IContentMeta | IResponseMeta | IResponseBodyMeta | IRequestBodyMeta | JsonSchemaNodeMeta
export type OpenApiModelTree = JsonSchemaModelTree<JsonSchemaNodeValue | null, OpenApiNodeKind, OpenApiNodeMeta>

export interface IServiceNodeMeta {
  info?: OpenAPIV3.InfoObject
  security?: OpenAPIV3.SecurityRequirementObject[]
  securitySchemes?: Record<string, OpenAPIV3.SecuritySchemeObject>
  externalDocs?: {
    description?: string
    url: string
  }
  _fragment: OpenAPIV3.Document
}

export interface IOperationNodeMeta {
  method: string
  path: string
  summary?: string
  description?: string
  servers?: OpenAPIV3.ServerObject[]
  tags?: string[]
  security?: OpenAPIV3.SecurityRequirementObject[]
  securityDeclarationType?: any
  deprecated?: boolean
  externalDocs?: OpenAPIV3.ExternalDocumentationObject
  _fragment: OpenAPIV3.OperationObject
}

export interface IParameterMeta extends JsonSchemaNodeMeta {
  in?: string
  description?: string
  allowEmptyValue?: boolean
}

export interface IContentMeta extends JsonSchemaNodeMeta {
  encoding?: Record<string, OpenAPIV3.EncodingObject>
  examples?: Record<string, OpenAPIV3.ExampleObject>
  example?: any
}

export interface IResponseMeta {
  description?: string
  _fragment: any
}

export interface IResponseBodyMeta {
  _fragment: any
} 

export interface IRequestBodyMeta {
  _fragment: any
} 
