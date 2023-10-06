import { jsonSchemaNodeKind } from "../jsonSchema";

export const openApiSpecificNodeKind = {
  operation: 'operation',
  service: 'service',
  parameters: 'parameters',
  parameter: 'parameter',
  requestBody: 'requestBody',
  oneOfContent: 'oneOfContent',
  body: 'body',
  responses: 'responses',
  oneOfResponse: 'oneOfResponse',
  response: 'response',
} as const

export const openApiSpecificNodeKinds = Object.keys(openApiSpecificNodeKind)

export const openApiNodeKind = {
  ...jsonSchemaNodeKind,
  ...openApiSpecificNodeKind,
} as const
