import { isObject, syncCrawl } from 'json-crawl'
import { merge } from "allof-merge"

import { 
  JsonSchemaCrawlState, JsonSchemaNodeValue, JsonSchemaFragment, JsonSchemaNodeKind, JsonSchemaNodeMeta 
} from "./jsonSchema.types"
import { createJsonSchemaTreeCrawlHook } from "./jsonSchema.node"
import { jsonSchemaCrawlRules } from "./jsonSchema.rules"
import { transformCrawlHook } from '../transform'
import { ModelTree } from "../modelTree"

export const createJsonSchemaTree = (schema: JsonSchemaFragment, source: any = schema) => {

  const tree = new ModelTree<JsonSchemaNodeValue, JsonSchemaNodeKind, JsonSchemaNodeMeta>()
  if (!isObject(schema) || !isObject(source)) {
    return tree
  }

  const data = merge(schema, { source, mergeRefSibling: true, mergeCombinarySibling: true })

  const crawlState: JsonSchemaCrawlState = { parent: null, source: data }

  syncCrawl(data, [
    transformCrawlHook,
    createJsonSchemaTreeCrawlHook(tree)
  ], { state: crawlState, rules: jsonSchemaCrawlRules() })

  return tree
}
