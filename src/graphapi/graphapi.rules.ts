import { CrawlRules } from "json-crawl"

import { graphApiNodeKind } from "./graphapi.consts"
import { GraphApiCrawlRule } from "./graphapi.types"
import { graphSchemaCrawlRules } from "../graphSchema"

export const graphApiCrawlRules: CrawlRules<GraphApiCrawlRule> = {
  "/queries": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiNodeKind.query
    }
  },
  "/mutations": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiNodeKind.mutation
    }
  },
  "/subscriptions": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiNodeKind.subscription
    }
  },
  "/components": {
    "/directives": {
      "/*": {
        "/args": graphSchemaCrawlRules(),
        kind: graphApiNodeKind.directive
      }
    }
  },
  kind: graphApiNodeKind.schema
}
