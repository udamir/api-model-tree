import { CrawlRules } from "json-crawl"

import { GraphSchemaCrawlRule, GraphSchemaNodeKind } from "./graphSchema.types"
import { transformDirectives, transformNullable } from "./graphSchema.utils"

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
  kind,
  transformers: [transformDirectives, transformNullable] 
})
