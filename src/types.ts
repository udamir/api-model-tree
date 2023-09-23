
import { JsonPath } from 'json-crawl'

import { modelTreeNodeType } from './consts'

export type ModelDataNode<T, K extends string> = IModelTreeNode<T, K> | IModelRefNode<T, K>
export type ModelTreeNodeType = keyof typeof modelTreeNodeType

export interface IModelRefNode<T, K extends string> extends IModelTreeNode<T, K> {
  ref: string
  isCycle: boolean
}

export interface IModelTree<T, K extends string> {
  root: IModelTreeNode<T, K> | null
  nodes: Map<string, IModelTreeNode<T, K>>
}

export interface IModelTreeNode<T, K extends string> {
  id: string
  key: string | number
  kind: K
  type: ModelTreeNodeType
  depth: number
  path: JsonPath
  parent: IModelTreeNode<T, K> | null
  nested: ModelDataNode<T, K>[]
  value(nestedId?: string): T | null
  children(nestedId?: string): ModelDataNode<T, K>[]
  nestedNode(nestedId?: string): ModelDataNode<T, K> | null
}
