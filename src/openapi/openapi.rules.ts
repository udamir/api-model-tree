import { CrawlRules } from "json-crawl"

import { allOfMerge, resolveRef, transformGlobalSecurity, transformPathItems } from "./openapi.transform"
import type { OpenApiCrawlRule } from "./openapi.types"
import { jsonSchemaCrawlRules } from "../jsonSchema"
import { openApiNodeKind } from "./openapi.consts"

export const openApiCrawlRules: CrawlRules<OpenApiCrawlRule> = {
  "/paths": {
    "/*": {
      "/*": {
        "/parameters": {
          "/*": {
            ...jsonSchemaCrawlRules(),
            kind: openApiNodeKind.parameter,
            transformers: [allOfMerge]
          },
        },
        "/requestBody": {
          "/content": {
            "/*": {
              ...jsonSchemaCrawlRules(),
              kind: openApiNodeKind.oneOfContent,
              transformers: [allOfMerge]
            }
          },
          // oneOf Content
          kind: openApiNodeKind.requestBody,
          transformers: [resolveRef]
        },
        "/responses": {
          "/*": {
            "/headers": {
              "/*": {
                ...jsonSchemaCrawlRules(),
                kind: openApiNodeKind.header,
                transformers: [allOfMerge]
              }
            },
            "/content": {
              "/*": {
                ...jsonSchemaCrawlRules(),
                kind: openApiNodeKind.oneOfContent,
                transformers: [allOfMerge]
              },
              // oneOf Content
              kind: openApiNodeKind.responseBody
            },
            // oneOf Content
            kind: openApiNodeKind.oneOfResponse,
          },
          // oneOf response
          kind: openApiNodeKind.response,
        },
        kind: openApiNodeKind.operation,
        transformers: [transformGlobalSecurity]
      },
      transformers: [resolveRef, transformPathItems]
    },
  },
  kind: openApiNodeKind.service,
  transformers: []
}
