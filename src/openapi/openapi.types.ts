import { GraphSchema } from 'gqlapi'

import { openApiNodeKind } from './openapi.consts'
import { GraphSchemaNodeData } from '../graphSchema'
import { ModelTreeNode } from '../modelTree'
import { SchemaCrawlRule } from '../types'

export type OpenApiNodeKind = keyof typeof openApiNodeKind

export type OpenApiCrawlRule = SchemaCrawlRule<any, OpenApiNodeKind>

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
