import { GraphSchema } from 'gqlapi'

import { graphSchemaNodeKind, graphSchemaNodeTypes } from './graphSchema.consts'
import { ModelTreeComplexNode, ModelTreeNode } from '../modelTree'
import { IJsonSchemaBaseType } from '../jsonSchema'
import { SchemaCrawlRule, SchemaTransformFunc } from '../types'

export type GraphSchemaNodeKind = keyof typeof graphSchemaNodeKind
export type GraphSchemaNodeType = typeof graphSchemaNodeTypes[number]

export type GraphSchemaFragment = GraphSchema

export type GraphSchemaTransformFunc = SchemaTransformFunc<GraphSchemaFragment>
export type GraphSchemaCrawlRule = SchemaCrawlRule<GraphSchemaFragment, GraphSchemaNodeKind>

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
  readonly directives?: Record<string, any> // TODO
  readonly args?: Record<string, IGraphSchemaObjectType>
  readonly values?: Record<string, IGraphSchemaEnumValueType>
  readonly deprecated?: boolean | { reason: string }
}

export interface IGraphSchemaNullType extends IGraphSchemaBaseType {
  readonly type: 'null'
}

export interface IGraphSchemaBooleanType extends IGraphSchemaBaseType {
  readonly type: 'boolean'
  readonly default?: string
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
