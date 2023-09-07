import type { JSONSchema4, JSONSchema6 } from 'json-schema'

import { ANNOTATIONS, jsonSchemaNodeKind, jsonSchemaNodeType } from './jsonSchema.consts'
import { ModelTreeComplexNode, ModelTreeNode } from '../modelTree'

export type JsonSchemaNodeKind = keyof typeof jsonSchemaNodeKind;
export type JsonSchemaNodeType = typeof jsonSchemaNodeType[keyof typeof jsonSchemaNodeType];
export type JsonSchemaAnnotations = typeof ANNOTATIONS[number];

export type JsonSchemaFragment = JSONSchema6 | JSONSchema4

export type JsonSchemaCrawlRule = {
  kind: JsonSchemaNodeKind
}

export interface IJsonSchemaNodeData {
  readonly $id: string | null;
  readonly types: JsonSchemaNodeType[] | null;
  readonly primaryType: JsonSchemaNodeType | null;

  readonly required: string[] | null;
  readonly enum: unknown[] | null; 
  readonly format: string | null;
  readonly title: string | null;
  readonly deprecated: boolean;

  readonly annotations: Readonly<Partial<Record<JsonSchemaAnnotations, unknown>>>;
  readonly validations: Readonly<Record<string, unknown>>;

  readonly unknown: boolean;
}

export type JsonSchemaTreeNode = ModelTreeNode<IJsonSchemaNodeData, JsonSchemaNodeKind>
export type JsonSchemaComplexNode = ModelTreeComplexNode<IJsonSchemaNodeData, JsonSchemaNodeKind>
export type JsonSchemaNode = JsonSchemaTreeNode | JsonSchemaComplexNode

export interface JsonSchemaCrawlState {
  parent: JsonSchemaTreeNode | null
  container?: JsonSchemaComplexNode
}
