import { jsonSchemaNodeKind } from "../jsonSchema";

export const openApiSpecificNodeKind = {
  operation: 'operation',
  service: 'service',
  parameter: 'parameter',
  header: 'header',
  requestBody: 'requestBody',
  oneOfContent: 'oneOfContent',
  oneOfResponse: 'oneOfResponse',
  response: 'response',
  responseBody: 'responseBody'
} as const

export const openApiSpecificNodeKinds = Object.keys(openApiSpecificNodeKind)

export const openApiNodeKind = {
  ...jsonSchemaNodeKind,
  ...openApiSpecificNodeKind,
} as const

export const openApiNodeKindMetaKeys = {
  'service': ['info', 'security', 'externalDocs'],
  'operation': ['method', 'path', 'summary', 'servers', 'security', 'deprecated', 'tags', 'externalDocs'],
  'parameter': ['in', 'description', 'required', 'deprecated', 'allowEmptyValue'],
  'content': ['example', 'examples', 'encoding'],
  'response': ['description'],
  'requestBody': ['description', 'required'],
  'responseBody': ['description'],
} as const
