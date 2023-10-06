import { SyncCrawlHook, syncCrawl } from 'json-crawl'
import { buildPointer } from "allof-merge"

import { createJsonSchemaTreeCrawlHook } from '../jsonSchema'
import { graphApiCrawlRules } from "./openapi.rules"
import { openApiSpecificNodeKinds } from './openapi.consts'
import { ModelTree } from "../modelTree"

/**
 * service
 *   operation (child)
 *     parameters (child)
 *       parameter (child)
 *     requestBody [complex] 
 *       oneOfContent (nested)
 *         content (child)
 *     responses [complex]
 *       oneOfresponse (nested)
 *         oneOfContent (nested)
 *           content (child)
 */

const createOpenApiTreeCrawlHook = (tree: ModelTree<any, any>): SyncCrawlHook => {
  return (value, ctx) => {
    if (!ctx.rules) { return null }
    if (!("kind" in ctx.rules) || !(openApiSpecificNodeKinds.includes(ctx.rules.kind))) { 
      return { value, state: ctx.state }
    }

    const id = "#" + buildPointer(ctx.path)
    const { parent } = ctx.state
    const { kind } = ctx.rules
 
    let node

    // TODO


    parent?.addChild(node)

    return { value, state: { parent: node } }
  }
}


export const createOpenApiTree = (schema: any) => {
  const tree = new ModelTree<any, any>()
  const crawlState = { parent: null }

  syncCrawl(
    schema,
    [
      createOpenApiTreeCrawlHook(tree),
      createJsonSchemaTreeCrawlHook(tree, schema)
    ], 
    { state: crawlState, rules: graphApiCrawlRules }
  )

  return tree
}
