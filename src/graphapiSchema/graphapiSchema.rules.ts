import { CrawlRules } from "json-crawl"

import { graphApiSchemaNodeKind } from "./graphapiSchema.consts"
import { GraphSchemaCrawlRule } from "./graphapiSchema.types"
import { graphSchemaCrawlRules } from "../graphSchema"

export const graphapiSchemaCrawlRules: CrawlRules<GraphSchemaCrawlRule> = {
  "/queries": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiSchemaNodeKind.query
    }
  },
  "/mutations": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiSchemaNodeKind.mutation
    }
  },
  "/subscriptions": {
    "/*": {
      ...graphSchemaCrawlRules(),
      kind: graphApiSchemaNodeKind.subsription
    }
  },
  "/components": {
    "/directives": {
      "/*": {
        ...graphSchemaCrawlRules(),
        kind: graphApiSchemaNodeKind.directive
      }
    }
  },
  kind: graphApiSchemaNodeKind.schema
}
