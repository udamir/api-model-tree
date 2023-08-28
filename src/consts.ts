export enum SchemaNodeKind {
  Any = 'any',
  String = 'string',
  Number = 'number',
  Integer = 'integer',
  Boolean = 'boolean',
  Null = 'null',
  Array = 'array',
  Object = 'object',
}

export enum SchemaCombinerName {
  AllOf = 'allOf',
  AnyOf = 'anyOf',
  OneOf = 'oneOf',
}

const ANNOTATIONS = ['description', 'default', 'examples'] as const;

export type SchemaAnnotations = typeof ANNOTATIONS[number];
