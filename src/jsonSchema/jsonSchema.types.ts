import type { JSONSchema4, JSONSchema6 } from 'json-schema'

import { jsonSchemaNodeKind, jsonSchemaNodeTypes } from './jsonSchema.consts'
import { ModelTreeComplexNode, ModelTreeNode } from '../modelTree'

export type JsonSchemaNodeKind = keyof typeof jsonSchemaNodeKind
export type JsonSchemaNodeType = typeof jsonSchemaNodeTypes[number]

export type JsonSchemaFragment<T = {}> = (JSONSchema6 | JSONSchema4) & T

export type JsonSchemaCrawlRule = {
  kind: JsonSchemaNodeKind
}

export type JsonSchemaTreeNode<T extends JsonSchemaNodeType> = ModelTreeNode<JsonSchemaNodeData<T>, JsonSchemaNodeKind>
export type JsonSchemaComplexNode<T extends JsonSchemaNodeType> = ModelTreeComplexNode<JsonSchemaNodeData<T>, JsonSchemaNodeKind>
export type JsonSchemaNode<T extends JsonSchemaNodeType> = JsonSchemaTreeNode<T> | JsonSchemaComplexNode<T>

export interface JsonSchemaCrawlState {
  parent: JsonSchemaTreeNode<any> | null
  container?: JsonSchemaComplexNode<any>
}

export type JsonSchemaTransformedFragment = JsonSchemaFragment & { 
  type: JsonSchemaNodeType
  exclusiveMinimum: number | undefined
  exclusiveMaximum: number | undefined
}

export type JsonSchemaTransformFunc = (value: JsonSchemaFragment) => JsonSchemaTransformedFragment

export type JsonSchemaNodeData<T extends JsonSchemaNodeType> = 
  T extends 'any' ? IJsonSchemaAnyType :
  T extends 'number' ? IJsonSchemaNumberType :
  T extends 'string' ? IJsonSchemaStringType : 
  T extends 'boolean' ? IJsonSchemaBooleanType :
  T extends 'object' ? IJsonSchemaObjectType :
  T extends 'array' ? IJsonSchemaArrayType :
  T extends 'null' ? IJsonSchemaNullType : never

export interface IJsonSchemaBaseType {
  // readonly $id: string
  // readonly style: string | null
  // readonly nullable: boolean | null 
  readonly type: JsonSchemaNodeType // type: [string, number] => anyOf: [ { type: string }, { type: number }]
  readonly title?: string
  readonly deprecated?: boolean // x-deprecated => deprecated
  readonly readOnly?: boolean
  readonly writeOnly?: boolean
  readonly description?: string
  readonly examples?: any[]
  // example: value => examples: [value]
  readonly enum?: any[]
  readonly default?: any
  readonly externalDocs?: any
  // const: value => enum: [value]
  readonly _fragment?: JsonSchemaTransformedFragment
}

export interface IJsonSchemaAnyType extends IJsonSchemaBaseType {
  readonly type: 'any'
}

export interface IJsonSchemaNullType extends IJsonSchemaBaseType {
  readonly type: 'null'
}

export interface IJsonSchemaBooleanType extends IJsonSchemaBaseType {
  readonly type: 'boolean'
  readonly default: boolean | null
}

export interface IJsonSchemaStringType extends IJsonSchemaBaseType {
  readonly type: 'string'
  readonly format?: string
  readonly enum?: string[]
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: string
  readonly default?: string
}

export interface IJsonSchemaNumberType extends IJsonSchemaBaseType {
  readonly type: 'number' | 'integer'
  readonly format?: string
  readonly enum?: number[]
  readonly multipleOf?: number
  readonly minimum?: number  // remove if exclusiveMinimum
  readonly exclusiveMinimum?: number // boolean => number
  readonly maximum?: number // remove if exclusiveMaximum
  readonly exclusiveMaximum?: number // boolean => number
  readonly default?: number // remove if wrong type
}

export interface IJsonSchemaObjectType extends IJsonSchemaBaseType {
  readonly type: 'object'
  readonly minProperties?: number
  readonly maxProperties?: number
  readonly required?: string[]
  readonly default?: any
  readonly propertyNames?: IJsonSchemaStringType
  // additionalProperties: true => child: additionalProperties: { type: any }
}

export interface IJsonSchemaArrayType extends IJsonSchemaBaseType {
  readonly type: 'array'
  readonly minItems?: number
  readonly maxItems?: number
  readonly uniqueItems?: boolean
  readonly default?: any
  // aditionalItems: true => child: additionalItems: { type: any }
}
