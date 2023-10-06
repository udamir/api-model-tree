import { GraphSchema } from 'gqlapi'
import { JsonPath } from 'json-crawl'

import { SchemaCrawlRule, SchemaTransformFunc } from '../types'
import { openApiNodeKind } from './openapi.consts'
import { GraphSchemaNodeData } from '../graphSchema'
import { ModelTreeNode } from '../modelTree'

export type OpenApiNodeKind = keyof typeof openApiNodeKind

export interface OpenApiTransformFuncContext {
  source: any
  path: JsonPath
}

export type OpenApiTransformFunc = SchemaTransformFunc<any, [OpenApiTransformFuncContext]>

export type OpenApiCrawlRule = SchemaCrawlRule<any, OpenApiNodeKind, [OpenApiTransformFuncContext]>

export type GraphapiTreeNode = ModelTreeNode<GraphApiNodeData, OpenApiNodeKind>

export type GraphApiNodeData = GraphApiSchemaNodeData | GraphApiDirectiveNodeData | GraphSchemaNodeData<any>

export interface GraphApiSchemaNodeData {
  description?: string
}

export interface GraphApiDirectiveNodeData {
  // name
  title: string

  // description
  description?: string

  // locations
  locations: string[]

  // args[]
  args?: GraphSchema

  // isRepeatable
  repeatable: boolean
}
