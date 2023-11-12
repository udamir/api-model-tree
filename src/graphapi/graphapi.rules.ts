import { CrawlRules } from "json-crawl"

import { GraphSchemaTransformers, graphSchemaCrawlRules, graphSchemaNodeKind } from "../graphSchema"
import type { GraphApiCrawlRule } from "./graphapi.types"
import { graphApiNodeKind } from "./graphapi.consts"

export const graphApiCrawlRules: CrawlRules<GraphApiCrawlRule> = {
  "/queries": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiNodeKind.query,
      transformers: GraphSchemaTransformers
    }
  },
  "/mutations": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiNodeKind.mutation,
      transformers: GraphSchemaTransformers
    }
  },
  "/subscriptions": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiNodeKind.subscription,
      transformers: GraphSchemaTransformers
    }
  },
  "/components": {
    "/directives": {
      "/*": {
        "/args": {
          "/properties": {
            "/*": () => graphSchemaCrawlRules(graphSchemaNodeKind.arg),
          },
          kind: graphSchemaNodeKind.args,
        },
        kind: graphApiNodeKind.directive
      }
    }
  },
  kind: graphApiNodeKind.schema
}
