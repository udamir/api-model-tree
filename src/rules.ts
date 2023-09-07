import { CrawlRules } from "json-crawl"
import { isNumber } from "./utils"

type JsonNodeRule = {
  node: string
}

export const jsonSchemaCrawlRules = (kind = "root"): CrawlRules<JsonNodeRule> => ({
  "/allOf": {
    "/*": () => jsonSchemaCrawlRules("allOf"),
  },
  "/not": () => jsonSchemaCrawlRules("not"),
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
  "/propertyNames": () => jsonSchemaCrawlRules("propertyNames"),
  // "/contains": () => jsonSchemaCrawlRules("contains"),
  "/dependencies": { 
    "/*": () => jsonSchemaCrawlRules("dependency"),
  },
  node: kind
})
