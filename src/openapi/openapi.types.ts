import { JsonPath } from 'json-crawl'

import { JsonSchemaNodeMeta, JsonSchemaNodeValue } from '../jsonSchema'
import { ModelTree, ModelTreeComplexNode } from '../modelTree'
import { ModelDataNode, SchemaCrawlRule } from '../types'
import { openApiNodeKind } from './openapi.consts'

export type OpenApiNodeKind = keyof typeof openApiNodeKind

export interface OpenApiTransformFuncContext {
  source: any
  path: JsonPath
}

export interface OpenApiCrawlState {
  parent: OpenApiTreeNode | null
  container?: OpenApiComplexNode
  source: any
}

export type OpenApiCrawlRule = SchemaCrawlRule<OpenApiNodeKind, OpenApiCrawlState>

export type OpenApiNodeValue<T extends OpenApiNodeKind = any> = IOpenApiServiceNodeValue | IOperationNodeValue | JsonSchemaNodeValue<any>
export type OpenApiNodeMeta<T extends OpenApiNodeKind = any> = any | JsonSchemaNodeMeta

export type OpenApiTreeNode<T extends OpenApiNodeKind = any> = ModelDataNode<OpenApiNodeValue<T>, OpenApiNodeKind, OpenApiNodeMeta<T>>
export type OpenApiComplexNode<T extends OpenApiNodeKind = any> = ModelTreeComplexNode<OpenApiNodeValue<T>, OpenApiNodeKind, OpenApiNodeMeta<T>>

export type OpenApiModelTree = ModelTree<OpenApiNodeValue, OpenApiNodeKind, OpenApiNodeMeta>

export interface IOpenApiServiceNodeValue {
  info: any
  security?: any[][]
  securitySchemes?: any[]
  externalDocs?: {
    description?: string
    url: string
  }
}

export interface IOperationNodeValue {
  method: string
  path: string
  servers?: {
    url: string
    name?: string
    description?: string
    variables?: Record<string, any>
  }[]
  security?: any[][]
  securityDeclarationType?: any
  deprecated?: boolean
  externalDocs?: {
    description?: string
    url: string
  }
}
