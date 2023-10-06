
import { JsonPath } from 'json-crawl'

import { modelStateNodeType, modelTreeNodeType } from './consts'


export type SchemaTransformFunc<T, C extends Array<any> = []> = (value: T, ...ctx: C) => any

export type SchemaCrawlRule<T, K extends string, C extends Array<any> = []> = {
  kind: K
  transformers: SchemaTransformFunc<T, C>[]
}

export type ModelDataNode<T, K extends string, D = any> = IModelTreeNode<T, K, D> | IModelRefNode<T, K, D>
export type ModelTreeNodeType = keyof typeof modelTreeNodeType

export interface IModelRefNode<T, K extends string, D = any> extends IModelTreeNode<T, K, D> {
  ref: string
  isCycle: boolean
}

export interface IModelTree<T, K extends string, D = any> {
  root: IModelTreeNode<T, K, D> | null
  nodes: Map<string, IModelTreeNode<T, K, D>>
}

export interface IModelTreeNode<T, K extends string, D = any> {
  id: string
  key: string | number
  kind: K
  type: ModelTreeNodeType
  depth: number
  path: JsonPath
  parent: IModelTreeNode<T, K> | null
  nested: ModelDataNode<T, K>[]
  data: D 
  value(nestedId?: string): T | null
  children(nestedId?: string): ModelDataNode<T, K>[]
  nestedNode(nestedId?: string, deep?: boolean): ModelDataNode<T, K> | null
}

export type ModelTreeNodeParams<T extends object, K extends string, D = any> = {
  type?: ModelTreeNodeType
  value?: T
  parent?: IModelTreeNode<T, K, D>
  required?: boolean
  countInDepth?: boolean
} & (D extends object ? D : {})

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
