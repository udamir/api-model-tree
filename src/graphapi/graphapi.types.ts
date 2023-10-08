import { GraphSchema } from 'gqlapi'

import { graphApiNodeKind } from './graphapi.consts'
import { GraphSchemaNodeMeta, GraphSchemaNodeValue } from '../graphSchema'
import { ModelTreeNode } from '../modelTree'

export type GraphApiNodeKind = keyof typeof graphApiNodeKind

export type GraphApiCrawlRule = {
  kind: GraphApiNodeKind
}

export type GraphOperationsFilter = (node: GraphapiTreeNode) => boolean

export type GraphapiTreeNode = ModelTreeNode<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>

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
