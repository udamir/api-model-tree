import { CrawlRules } from "json-crawl"

import { GraphSchemaCrawlRule, GraphSchemaNodeKind } from "./graphSchema.types"

export const graphSchemaCrawlRules = (kind: GraphSchemaNodeKind = "root"): CrawlRules<GraphSchemaCrawlRule> => ({
  "/allOf": {
    "/*": () => graphSchemaCrawlRules("allOf"),
  },
  "/oneOf": {
    "/*": () => graphSchemaCrawlRules("oneOf"),
  },
  "/anyOf": {
    "/*": () => graphSchemaCrawlRules("anyOf"),
  },
  "/properties": {
    "/*": () => graphSchemaCrawlRules("property"),
  },
  "/args": {
    "/*": { // TODO  GraphApiField: args => Record<string, GraphApiType>
      "/schema": () => graphSchemaCrawlRules("arg"),
    }
  },
  "/items": () => graphSchemaCrawlRules("items"),
  // ------ not supported properties ------------
  // "/not": () => graphSchemaCrawlRules("not"),
  kind
})
