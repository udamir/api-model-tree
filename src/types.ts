
import { JsonPath } from 'json-crawl'

import { modelStateNodeType, modelTreeNodeType } from './consts'


export type SchemaTransformFunc<T> = (value: T) => any

export type SchemaCrawlRule<T, K extends string> = {
  kind: K
  transformers: SchemaTransformFunc<T>[]
}

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

export type ModelStateNodeType = keyof typeof modelStateNodeType

export type IModelStateNode<T> = IModelStateCombinaryNode<T> | IModelStatePropNode<T>

export interface IModelStatePropNode<T> {
  readonly type: Exclude<ModelStateNodeType, 'combinary'>
  readonly node: ModelDataNode<T, any>

  // selected combinary item id (for nodes with combinary children)
  readonly selected: string | undefined

  // node.value(selected)
  readonly value: T | null
  // node.nestedNode(selected)
  readonly nestedNode: ModelDataNode<T, any> | null
  // list of child state nodes
  readonly children: IModelStateNode<T>[] 
  // if true - this is the first child of group (args/properties/items)
  readonly first: boolean
  // expanded state
  readonly expanded: boolean

  // all children nodes in flat list (including children of all levels)
  readonly allChildren: IModelStateNode<T>[]
  // all children count included children of all levels
  readonly allChildrenCount: number 

  // sort child nodes
  sort(dir?: number): void

  expand(value?: number): void 
  collapse(value?: number): void

  setSelected(id: string): void
}

export interface IModelStateCombinaryNode<T> {
  readonly type: Exclude<ModelStateNodeType, 'basic' | 'expandable'>
  readonly node: ModelDataNode<T, any>

  // selected combinary item id
  readonly selected: string | undefined

  select(id: string): void
}
