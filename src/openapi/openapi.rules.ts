import { CrawlRules } from "json-crawl"
import { merge } from "allof-merge"

import { OpenApiCrawlRule, OpenApiTransformFunc } from "./openapi.types"
import { jsonSchemaCrawlRules } from "../jsonSchema"
import { openApiNodeKind } from "./openapi.consts"

const allOfMerge: OpenApiTransformFunc = (value, {source}) => {
  return merge(value, { source, mergeRefSibling: true, mergeCombinarySibling: true })
}

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
              transformers: [allOfMerge]
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
                transformers: [allOfMerge]
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
                  transformers: [allOfMerge]
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
