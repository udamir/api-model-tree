import { jsonSchemaNodeKind } from "../jsonSchema";

export const openApiNodeKinds = ['operation', 'service', 'parameters', 'parameter', 'requestBody', 'oneOfContent', 'body', 'responses', 'oneOfResponse', 'response']

export const openApiNodeKind = {
  ...jsonSchemaNodeKind,
  service: 'service',
  operation: 'operation',
  parameters: 'parameters',
  parameter: 'parameter',
  requestBody: 'requestBody',
  oneOfContent: 'oneOfContent',
  body: 'body',
  responses: 'responses',
  oneOfResponse: 'oneOfResponse',
  response: 'response',
} as const
