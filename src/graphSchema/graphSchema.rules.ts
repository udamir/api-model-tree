import { CrawlRules } from "json-crawl"

import { transformDirectives, transformNullable, transformValues } from "./graphSchema.utils"
import { GraphSchemaCrawlRule, GraphSchemaNodeKind } from "./graphSchema.types"
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
  transformers: [transformDirectives, transformNullable, transformValues] 
})
