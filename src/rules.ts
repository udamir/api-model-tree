import { CrawlRules } from "json-crawl"
import { isNumber } from "./utils"

type JsonNodeRule = {
  node: boolean
}

export const jsonSchemaCrawlRules: CrawlRules<JsonNodeRule> = {
  "/allOf": {
    "/*": () => jsonSchemaCrawlRules,
  },
  "/not": () => jsonSchemaCrawlRules,
  "/oneOf": {
    "/*": () => jsonSchemaCrawlRules,
  },
  "/anyOf": {
    "/*": () => jsonSchemaCrawlRules,
  },
  "/properties": {
    "/*": () => jsonSchemaCrawlRules,
  },
  "/items": () => ({
    ...jsonSchemaCrawlRules,
    "/*": (path) => isNumber(path[path.length-1]) ? jsonSchemaCrawlRules : {},
  }),
  "/additionalProperties": () => jsonSchemaCrawlRules,
  "/additionalItems": () => jsonSchemaCrawlRules,
  "/patternProperties": { 
    "/*": () => jsonSchemaCrawlRules,
  },
  "/propertyNames": () => jsonSchemaCrawlRules,
  "/contains": () => jsonSchemaCrawlRules,
  "/dependencies": { 
    "/*": () => jsonSchemaCrawlRules,
  },
  node: true
} 