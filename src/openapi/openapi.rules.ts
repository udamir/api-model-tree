import { CrawlRules } from "json-crawl"

import { openApiNodeKind } from "./openapi.consts"
import { OpenApiCrawlRule } from "./openapi.types"
import { jsonSchemaCrawlRules } from "../jsonSchema"


const transformPathParameters = () => {
  // copy path parameters to all methods

}

const transformGlobalSecurity = () => {
  // copy global security to operation
}

export const graphApiCrawlRules: CrawlRules<OpenApiCrawlRule> = {
  "/paths": {
    "/*": {
      "/*": {
        "/parameters": {
          "/*": {
            "/schema": jsonSchemaCrawlRules("property"), //TODO
            kind: openApiNodeKind.parameter
          },
          kind: openApiNodeKind.parameters
        },
        "/requestBody": {
          "/content": {
            "/schema": jsonSchemaCrawlRules("property"),
            kind: openApiNodeKind.content
          },
          kind: openApiNodeKind.requestBody
        },
        kind: openApiNodeKind.operation,
        transformers: [transformGlobalSecurity]
      },
      transformers: [transformPathParameters]
    }
  },
  "/components": {
    "/securitySchemes": {
      "/*": {
        kind: openApiNodeKind.securitySchema
      },
    },
  },
  kind: openApiNodeKind.service,
  transformers: []
}
