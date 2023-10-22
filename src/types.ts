
import { JsonPath } from 'json-crawl'

import { modelStateNodeType, modelTreeNodeType } from './consts'


export type SchemaTransformFunc<S> = (value: unknown, source: unknown, path: JsonPath, state: S) => any

export type SchemaCrawlRule<K extends string, S> = {
  kind: K
  transformers: SchemaTransformFunc<S>[]
}

export interface CreateNodeResult<T extends IModelTreeNode<any, any, any>> {
  value: any | null
  node: T
}

export type ModelDataNode<T, K extends string, M> = IModelTreeNode<T, K, M> | IModelRefNode<T, K, M>
export type ModelTreeNodeType = keyof typeof modelTreeNodeType

export interface IModelRefNode<T, K extends string, M> extends IModelTreeNode<T, K, M> {
  ref: string
  isCycle: boolean
}

export interface IModelTree<T, K extends string, M> {
  root: IModelTreeNode<T, K, M> | null
  nodes: Map<string, IModelTreeNode<T, K, M>>
}

export interface IModelTreeNode<T, K extends string, M> {
  id: string
  key: string | number
  kind: K
  type: ModelTreeNodeType
  depth: number
  path: JsonPath
  parent: IModelTreeNode<T, K, M> | null
  nested: ModelDataNode<T, K, M>[]
  meta: M 
  value(nestedId?: string): T | null
  children(nestedId?: string): ModelDataNode<T, K, M>[]
  nestedNode(nestedId?: string, deep?: boolean): ModelDataNode<T, K, M> | null

  addChild(node: ModelDataNode<T, K, M>): void
  addNestedNode(node: ModelDataNode<T, K, M>): void
}

export type ModelTreeNodeParams<T, K extends string, M> = {
  type?: ModelTreeNodeType
  value?: T
  meta?: M
  parent?: IModelTreeNode<any, any, any> | null
  countInDepth?: boolean
}

export type ModelStateNodeType = keyof typeof modelStateNodeType

export type IModelStateNode<T extends IModelTreeNode<any, any, any>> = IModelStateCombinaryNode<T> | IModelStatePropNode<T>

export interface IModelStatePropNode<T extends IModelTreeNode<any, any, any>> {
  readonly type: Exclude<ModelStateNodeType, 'combinary'>
  readonly node: T

  // selected combinary item id (for nodes with combinary children)
  readonly selected: string | undefined

  // node.meta
  readonly meta: T['meta']
  // node.value(selected)
  readonly value: ReturnType<T['value']> | null
  // node.nestedNode(selected)
  readonly nestedNode: T | null
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

export interface IModelStateCombinaryNode<T extends IModelTreeNode<any, any, any>> {
  readonly type: Exclude<ModelStateNodeType, 'basic' | 'expandable'>
  readonly node: T

  // selected combinary item id
  readonly selected: string | undefined

  select(id: string): void
}
