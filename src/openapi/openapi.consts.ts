import { jsonSchemaNodeKind } from "../jsonSchema";

export const openApiNodeKinds = ['operation', 'service', 'parameters', 'parameter', 'requestBody', 'content', 'responses', 'response', 'securitySchema']

export const openApiNodeKind = {
  ...jsonSchemaNodeKind,
  service: 'service',
  operation: 'operation',
  parameters: 'parameters',
  parameter: 'parameter',
  requestBody: 'requestBody',
  content: 'content',
  responses: 'responses',
  response: 'response',
  securitySchema: 'securitySchema'
} as const
