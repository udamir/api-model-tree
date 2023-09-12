import { GraphApiEnum, GraphApiList, GraphApiObject, GraphApiScalar, GraphApiUnion } from 'gqlapi'

import { graphSchemaNodeKind, graphSchemaNodeTypes } from './graphSchema.consts'
import { ModelTreeComplexNode, ModelTreeNode } from '../modelTree'
import { IJsonSchemaBaseType } from '../jsonSchema'

export type GraphSchemaNodeKind = keyof typeof graphSchemaNodeKind
export type GraphSchemaNodeType = typeof graphSchemaNodeTypes[number]

export type GraphSchemaFragment = GraphApiObject | GraphApiScalar | GraphApiUnion | GraphApiEnum | GraphApiList

export type GraphSchemaCrawlRule = {
  kind: GraphSchemaNodeKind
}

export type GraphSchemaTreeNode<T extends GraphSchemaNodeType> = ModelTreeNode<GraphSchemaNodeData<T>, GraphSchemaNodeKind>
export type GraphSchemaComplexNode<T extends GraphSchemaNodeType> = ModelTreeComplexNode<GraphSchemaNodeData<T>, GraphSchemaNodeKind>
export type GraphSchemaNode<T extends GraphSchemaNodeType> = GraphSchemaTreeNode<T> | GraphSchemaComplexNode<T>

export interface GraphSchemaCrawlState {
  parent: GraphSchemaTreeNode<any> | null
  container?: GraphSchemaComplexNode<any>
}

export type GraphSchemaNodeData<T extends GraphSchemaNodeType> = 
  T extends 'number' ? IGraphSchemaNumberType :
  T extends 'string' ? IGraphSchemaStringType : 
  T extends 'boolean' ? IGraphSchemaBooleanType :
  T extends 'object' ? IGraphSchemaObjectType :
  T extends 'array' ? IGraphSchemaArrayType :
  T extends 'null' ? IGraphSchemaNullType : never

export interface IGraphSchemaBaseType extends IJsonSchemaBaseType {
  directives?: Record<string, any> // TODO
  args?: Record<string, any> // TODO
}

export interface IGraphSchemaAnyType extends IGraphSchemaBaseType {
  readonly type: 'any'
}

export interface IGraphSchemaNullType extends IGraphSchemaBaseType {
  readonly type: 'null'
}

export interface IGraphSchemaBooleanType extends IGraphSchemaBaseType {
  readonly type: 'boolean'
}

export interface IGraphSchemaStringType extends IGraphSchemaBaseType {
  readonly type: 'string'
  readonly format?: string
  readonly enum?: string[]
  readonly default?: string
}

export interface IGraphSchemaNumberType extends IGraphSchemaBaseType {
  readonly type: 'number' | 'integer'
  readonly format?: string
  readonly enum?: number[]
  readonly default?: number // remove if wrong type
}

export interface IGraphSchemaObjectType extends IGraphSchemaBaseType {
  readonly type: 'object'
  readonly required?: string[]
}

export interface IGraphSchemaArrayType extends IGraphSchemaBaseType {
  readonly type: 'array'
  readonly default?: any
}
