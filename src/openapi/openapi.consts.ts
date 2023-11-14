import { jsonSchemaNodeKind } from "../jsonSchema"

/**
 * service [simple]
 *   - operation [simple]
 *     - parameter (schema)
 *     - requestBody [oneOf]
 *       = oneOfcontent (schema)
 *     - response [oneOf]
 *       = oneOfresponse [simple]
 *         - header (schema)
 *         - responseBody [oneOf]
 *           = oneOfcontent (schema)
 */

export const openApiSpecificNodeKind = {
  service: "service",
  operation: "operation",
  parameter: "parameter",
  requestBody: "requestBody",
  oneOfContent: "oneOfContent",
  response: "response",
  oneOfResponse: "oneOfResponse",
  header: "header",
  responseBody: "responseBody",
} as const

export const openApiSpecificNodeKinds = Object.keys(openApiSpecificNodeKind)

export const openApiNodeKind = {
  ...jsonSchemaNodeKind,
  ...openApiSpecificNodeKind,
} as const

export const openApiNodeKindMetaKeys = {
  service: ["info", "security", "externalDocs"],
  operation: ["method", "path", "summary", "description", "servers", "security", "deprecated", "tags", "externalDocs"],
  parameter: ["in", "description", "required", "deprecated", "allowEmptyValue"],
  content: ["example", "examples", "encoding"],
  response: ["description"],
  requestBody: ["description", "required"],
  responseBody: ["description"],
} as const
