import { CrawlRules } from "json-crawl"

import { GraphSchemaCrawlRule, GraphSchemaNodeKind } from "./graphSchema.types"

export const graphSchemaCrawlRules = (kind: GraphSchemaNodeKind = "root"): CrawlRules<GraphSchemaCrawlRule> => ({
  "/allOf": {
    "/*": () => graphSchemaCrawlRules("allOf"),
  },
  "/oneOf": {
    "/*": () => graphSchemaCrawlRules("oneOf"),
  },
  "/properties": {
    "/*": () => graphSchemaCrawlRules("property"),
  },
  "/args": {
    "/properties": {
      "/*": () => graphSchemaCrawlRules("arg"),
    },
    kind: 'args'
  },
  "/items": () => graphSchemaCrawlRules("items"),
  kind
})
