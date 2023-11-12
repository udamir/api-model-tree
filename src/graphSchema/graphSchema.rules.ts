import { CrawlRules } from "json-crawl"

import type { GraphSchemaCrawlRule, GraphSchemaNodeKind } from "./graphSchema.types"
import { GraphSchemaTransformers } from "./graphSchema.transform"
import { graphSchemaNodeKind } from "./graphSchema.consts"

export const graphSchemaCrawlRules = (kind: GraphSchemaNodeKind = graphSchemaNodeKind.root): CrawlRules<GraphSchemaCrawlRule> => ({
  "/allOf": {
    "/*": () => graphSchemaCrawlRules(graphSchemaNodeKind.allOf),
  },
  "/oneOf": {
    "/*": () => graphSchemaCrawlRules(graphSchemaNodeKind.oneOf),
  },
  "/properties": {
    "/*": () => graphSchemaCrawlRules(graphSchemaNodeKind.property),
  },
  "/args": {
    "/properties": {
      "/*": () => graphSchemaCrawlRules(graphSchemaNodeKind.arg),
    },
    kind: graphSchemaNodeKind.args
  },
  "/items": () => graphSchemaCrawlRules(graphSchemaNodeKind.items),
  kind,
  transformers: GraphSchemaTransformers 
})
