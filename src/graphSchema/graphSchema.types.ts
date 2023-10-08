import { GraphSchema } from 'gqlapi'

import { ModelTree, ModelTreeComplexNode, ModelTreeNode } from '../modelTree'
import { graphSchemaNodeKind, graphSchemaNodeTypes } from './graphSchema.consts'
import { SchemaCrawlRule, SchemaTransformFunc } from '../types'
import { IJsonSchemaBaseType } from '../jsonSchema'

export type GraphSchemaNodeKind = keyof typeof graphSchemaNodeKind
export type GraphSchemaNodeType = typeof graphSchemaNodeTypes[number]

export type GraphSchemaFragment = GraphSchema

export type GraphSchemaTransformFunc = SchemaTransformFunc<GraphSchemaFragment>
export type GraphSchemaCrawlRule = SchemaCrawlRule<GraphSchemaFragment, GraphSchemaNodeKind>

export type GraphSchemaNodeMeta = {
  readonly required?: boolean
  readonly args?: Record<string, IGraphSchemaObjectType>
  readonly directives?: Record<string, any> // TODO
  readonly deprecated?: boolean | { reason: string }
}

export type GraphSchemaModelTree = ModelTree<GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta>

export type GraphSchemaTreeNode<T extends GraphSchemaNodeType = any> = ModelTreeNode<GraphSchemaNodeValue<T>, GraphSchemaNodeKind, GraphSchemaNodeMeta>
export type GraphSchemaComplexNode<T extends GraphSchemaNodeType = any> = ModelTreeComplexNode<GraphSchemaNodeValue<T>, GraphSchemaNodeKind, GraphSchemaNodeMeta>
export type GraphSchemaNode<T extends GraphSchemaNodeType = any> = GraphSchemaTreeNode<T> | GraphSchemaComplexNode<T>

export interface GraphSchemaCrawlState {
  parent: GraphSchemaTreeNode<any> | null
  container?: GraphSchemaComplexNode<any>
}

export type GraphSchemaNodeValue<T extends GraphSchemaNodeType = any> = 
  T extends 'number' ? IGraphSchemaNumberType :
  T extends 'string' ? IGraphSchemaStringType : 
  T extends 'boolean' ? IGraphSchemaBooleanType :
  T extends 'object' ? IGraphSchemaObjectType :
  T extends 'array' ? IGraphSchemaArrayType :
  T extends 'null' ? IGraphSchemaNullType : never

export interface IGraphSchemaBaseType extends IJsonSchemaBaseType {
}

export interface IGraphSchemaNullType extends IGraphSchemaBaseType {
  readonly type: 'null'
}

export interface IGraphSchemaBooleanType extends IGraphSchemaBaseType {
  readonly type: 'boolean'
  readonly default?: boolean
}

export interface IGraphSchemaStringType extends IGraphSchemaBaseType {
  readonly type: 'string'
  readonly format?: string
  readonly enum?: string[]
  readonly values?: Record<string, IGraphSchemaEnumValueType>
  readonly default?: string
}

export interface IGraphSchemaEnumValueType {
  readonly description?: string
  readonly deprecated?: boolean | { reason: string }
}

export interface IGraphSchemaNumberType extends IGraphSchemaBaseType {
  readonly type: 'number' | 'integer'
  readonly format?: string
  readonly default?: number // remove if wrong type
}

export interface IGraphSchemaObjectType extends IGraphSchemaBaseType {
  readonly type: 'object'
  readonly required?: string[]
  readonly default?: any
}

export interface IGraphSchemaArrayType extends IGraphSchemaBaseType {
  readonly type: 'array'
  readonly default?: any
}
