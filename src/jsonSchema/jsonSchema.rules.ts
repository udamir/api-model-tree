import { CrawlRules } from "json-crawl"

import { JsonSchemaCrawlRule, JsonSchemaNodeKind } from "./jsonSchema.types"
import { isNumber } from "../utils"

export const jsonSchemaCrawlRules = (kind: JsonSchemaNodeKind = "root"): CrawlRules<JsonSchemaCrawlRule> => ({
  "/allOf": {
    "/*": () => jsonSchemaCrawlRules("allOf"),
  },
  "/oneOf": {
    "/*": () => jsonSchemaCrawlRules("oneOf"),
  },
  "/anyOf": {
    "/*": () => jsonSchemaCrawlRules("anyOf"),
  },
  "/properties": {
    "/*": () => jsonSchemaCrawlRules("property"),
  },
  "/items": () => ({
    ...jsonSchemaCrawlRules("items"),
    "/*": (path) => isNumber(path[path.length-1]) ? jsonSchemaCrawlRules("item") : {},
  }),
  "/additionalProperties": () => jsonSchemaCrawlRules("additionalProperties"),
  "/additionalItems": () => jsonSchemaCrawlRules("additionalItems"),
  "/patternProperties": { 
    "/*": () => jsonSchemaCrawlRules("patternProperty"),
  },
  // "/not": () => jsonSchemaCrawlRules("not"),
  // "/propertyNames": () => jsonSchemaCrawlRules("propertyNames"),
  // "/contains": () => jsonSchemaCrawlRules("contains"),
  // "/dependencies": { 
  //   "/*": () => jsonSchemaCrawlRules("dependency"),
  // },
  kind
})
