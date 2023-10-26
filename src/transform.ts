import { SyncCrawlHook } from "json-crawl"

import { SchemaCrawlRule, SchemaTransformFunc } from "./types"

export const createTransformCrawlHook = <T extends {}>(source: unknown): SyncCrawlHook<T, SchemaCrawlRule<any, any>> => {
  return ({ value, path, state, rules }) => {
    if (!rules || !Array.isArray(rules.transformers) || Array.isArray(value)) { 
      return
    }

    const jsonSchemaTransormers: SchemaTransformFunc<any>[] = rules.transformers ?? []
    const _value = jsonSchemaTransormers.reduce((current, transformer) => transformer(current, source, path, state), value as any)

    return { value: _value }
  }
}
