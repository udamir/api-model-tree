import { CrawlRules } from "json-crawl"

import { graphSchemaCrawlRules } from "../graphSchema"
import { graphApiNodeKind } from "./graphapi.consts"
import { GraphApiCrawlRule } from "./graphapi.types"

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
