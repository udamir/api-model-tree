import { CrawlContext, CrawlHookResponse } from "json-crawl"

import { SchemaCrawlRule, SchemaTransformFunc } from "./types"

export const createTransformCrawlHook = <T>(source: unknown) => {
  return (value: unknown, ctx: CrawlContext<T, SchemaCrawlRule<any, any>>): CrawlHookResponse<T> | null => {
    if (!ctx.rules || !("transformers" in ctx.rules) || !Array.isArray(ctx.rules.transformers) || Array.isArray(value)) { 
      return { value: value, state: ctx.state }
    }

    const jsonSchemaTransormers: SchemaTransformFunc<any>[] = ctx.rules.transformers ?? []
    const _value = jsonSchemaTransormers.reduce((current, transformer) => transformer(current, source, ctx.path, ctx.state), value as any)

    return { value: _value, state: ctx.state }
  }
}
