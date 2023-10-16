import { CrawlRules } from "json-crawl"

import { GraphSchemaTransformers, graphSchemaCrawlRules } from "../graphSchema"
import { graphApiNodeKind } from "./graphapi.consts"
import { GraphApiCrawlRule } from "./graphapi.types"

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
            "/*": () => graphSchemaCrawlRules(graphApiNodeKind.arg),
          },
          kind: graphApiNodeKind.args,
        },
        kind: graphApiNodeKind.directive
      }
    }
  },
  kind: graphApiNodeKind.schema
}
