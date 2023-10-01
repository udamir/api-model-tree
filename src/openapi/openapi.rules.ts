import { CrawlRules } from "json-crawl"

import { jsonSchemaCrawlRules, transformJsonSchema } from "../jsonSchema"
import { openApiNodeKind } from "./openapi.consts"
import { OpenApiCrawlRule } from "./openapi.types"


const transformPathParameters = () => {
  // copy path parameters to all methods

}

const transformGlobalSecurity = () => {
  // copy global security to operation
}

const transformParameterToJsonSchema = () => {
  
}

const transformContentToJsonSchema = () => {

}

export const graphApiCrawlRules: CrawlRules<OpenApiCrawlRule> = {
  "/paths": {
    "/*": {
      "/*": {
        "/parameters": {
          "/*": {
            "/schema": {
              ...jsonSchemaCrawlRules(),
              kind: openApiNodeKind.parameter,
              transformers: [transformJsonSchema]
            },
            transformers: [transformParameterToJsonSchema]
          },
          kind: openApiNodeKind.parameters
        },
        "/requestBody": {
          "/content": {
            "/*": {
              "/schema": {
                ...jsonSchemaCrawlRules(),
                kind: openApiNodeKind.body,
                transformers: [transformJsonSchema]
              },
              kind: openApiNodeKind.oneOfContent,
              transformers: [transformContentToJsonSchema]
            }
          },
          kind: openApiNodeKind.requestBody
        },
        "/responses": {
          "/*": {
            "/content": {
              "/*": {
                "/schema": {
                  ...jsonSchemaCrawlRules(),
                  kind: openApiNodeKind.response,
                  transformers: [transformJsonSchema]
                },
                kind: openApiNodeKind.oneOfContent
              }
            },
            kind: openApiNodeKind.oneOfResponse,
          },
          kind: openApiNodeKind.responses,
        },
        kind: openApiNodeKind.operation,
        transformers: [transformGlobalSecurity]
      },
      transformers: [transformPathParameters]
    }
  },
  kind: openApiNodeKind.service,
  transformers: []
}


/**
 * service
 *   operation (child)
 *     parameters (child)
 *       parameter (child)
 *     requestBody [complex] 
 *       oneOfContent (nested)
 *         content (child)
 *     responses [complex]
 *       oneOfresponse (nested)
 *         oneOfContent (nested)
 *           content (child)
 */