import { GraphSchema } from 'gqlapi'

import { graphApiNodeKind } from './graphapi.consts'
import { GraphSchemaNodeData } from '../graphSchema'
import { ModelTreeNode } from '../modelTree'

export type GraphApiNodeKind = keyof typeof graphApiNodeKind

export type GraphApiCrawlRule = {
  kind: GraphApiNodeKind
}

export type GraphapiTreeNode = ModelTreeNode<GraphApiNodeData, GraphApiNodeKind>

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
