import type { JSONSchema4, JSONSchema6 } from 'json-schema';
import { JsonPath } from 'json-crawl';

import { SchemaAnnotations, SchemaNodeKind } from './consts';
import { ModelTreeComplexNode as ModelTreeComplexNode, ModelTreeNode as ModelTreeNode } from './modelTree';

export type SchemaFragment = JSONSchema6 | JSONSchema4

export type ModelDataNode<T> = IModelTreeNode<T> | IModelRefNode<T>

export interface IModelRefNode<T> extends IModelTreeNode<T> {
  ref: string
  isCycle?: boolean
}

export interface IModelTree<T> {
  root: IModelTreeNode<T> | null
  nodes: Map<string, IModelTreeNode<T>>
}

export interface IModelTreeNode<T> {
  id: string
  key: string | number
  type: string
  depth: number
  path: JsonPath
  parent: IModelTreeNode<T> | null
  nested: ModelDataNode<T>[]
  value(nestedId?: string): T | null
  children(nestedId?: string): ModelDataNode<T>[]
}

export interface IJsonNodeData {
  readonly $id: string | null;
  readonly types: SchemaNodeKind[] | null;
  readonly primaryType: SchemaNodeKind | null;
  // readonly combiners: SchemaCombinerName[] | null;

  readonly required: string[] | null;
  readonly enum: unknown[] | null; 
  readonly format: string | null;
  readonly title: string | null;
  readonly deprecated: boolean;

  readonly annotations: Readonly<Partial<Record<SchemaAnnotations, unknown>>>;
  readonly validations: Readonly<Record<string, unknown>>;

  readonly unknown: boolean;
}

export type JsonSchemaNode = ModelTreeNode<IJsonNodeData> | ModelTreeComplexNode<IJsonNodeData>

export type ParentType = 'simple' | 'anyOf' | 'oneOf'

export interface CrawlState {
  parent: ModelTreeNode<IJsonNodeData> | null
  container?: ModelTreeComplexNode<IJsonNodeData>
}
