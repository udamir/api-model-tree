import { CrawlRules } from "json-crawl"

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
    "/*": () => jsonSchemaCrawlRules,
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