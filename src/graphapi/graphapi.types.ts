import { GraphSchema } from 'gqlapi'

import { GraphSchemaCrawlState, GraphSchemaNodeKind, GraphSchemaNodeMeta, GraphSchemaNodeValue } from '../graphSchema'
import { graphApiNodeKind } from './graphapi.consts'
import { ModelTreeNode } from '../modelTree'
import { SchemaCrawlRule } from '../types'

export type GraphApiNodeKind = GraphSchemaNodeKind | keyof typeof graphApiNodeKind
export type GraphApiCrawlState = GraphSchemaCrawlState & {
  source: any
}

export type GraphApiCrawlRule = SchemaCrawlRule<GraphApiNodeKind, GraphApiCrawlState>

export type GraphOperationsFilter = (node: GraphApiTreeNode) => boolean

export type GraphApiTreeNode = ModelTreeNode<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>

export type GraphApiNodeData = GraphApiSchemaNodeData | GraphApiDirectiveNodeData | GraphSchemaNodeValue<any>

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
