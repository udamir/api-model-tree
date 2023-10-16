import { jsonSchemaNodeKind } from "../jsonSchema";

export const openApiSpecificNodeKind = {
  operation: 'operation',
  service: 'service',
  parameters: 'parameters',
  parameter: 'parameter',
  header: 'header',
  requestBody: 'requestBody',
  oneOfContent: 'oneOfContent',
  body: 'body',
  responses: 'responses',
  oneOfResponse: 'oneOfResponse',
  response: 'response',
  responseBody: 'responseBody'
} as const

export const openApiSpecificNodeKinds = Object.keys(openApiSpecificNodeKind)

export const openApiNodeKind = {
  ...jsonSchemaNodeKind,
  ...openApiSpecificNodeKind,
} as const

export const openApiNodeKindValueKeys = {
  'service': ['info', 'security', 'externalDocs'],
  'operation': ['method', 'path', 'summary', 'servers', 'security', 'deprecated', 'tags', 'externalDocs']
}
