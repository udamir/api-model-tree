import type { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import { SchemaAnnotations, SchemaCombinerName, SchemaNodeKind } from './consts';
import { DimTreeNode } from './dimTree';

export type SchemaFragment = Record<string, unknown> | JSONSchema4 | JSONSchema6 | JSONSchema7;

export type DimDataNode<T> = IDimTreeNode<T> | IDimRefNode<T>

export interface IDimRefNode<T> extends IDimTreeNode<T> {
  isRef: boolean
  isCycle?: boolean
}

export interface IDimTree<T> {
  root: IDimTreeNode<T> | null
  nodes: Map<string, IDimTreeNode<T>>
}

export interface IDimTreeNode<T> {
  id: string
  type: string
  depth: number
  path: ReadonlyArray<string>
  parent: IDimTreeNode<T> | null
  value: T
  dimensions: string[]
  children(dim?: string): DimDataNode<T>[]
}

export interface IJsonNodeData {
  readonly $id: string | null;
  readonly types: SchemaNodeKind[] | null;
  readonly primaryType: SchemaNodeKind | null;
  readonly combiners: SchemaCombinerName[] | null;

  readonly required: string[] | null;
  readonly enum: unknown[] | null; 
  readonly format: string | null;
  readonly title: string | null;
  readonly deprecated: boolean;

  readonly annotations: Readonly<Partial<Record<SchemaAnnotations, unknown>>>;
  readonly validations: Readonly<Record<string, unknown>>;

  readonly unknown: boolean;
}

export type JsonSchemaNode = DimTreeNode<IJsonNodeData>

export type ParentType = 'simple' | 'anyOf' | 'oneOf'

export interface CrawlState {
  parent: JsonSchemaNode| null
  parentType: ParentType
}
