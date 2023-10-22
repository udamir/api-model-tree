import { syncCrawl } from 'json-crawl'

import { 
  GraphSchemaCrawlState, GraphSchemaNodeValue, GraphSchemaFragment, GraphSchemaNodeKind, 
  GraphSchemaModelTree, GraphSchemaNodeMeta 
} from "./graphSchema.types"

import { createGraphSchemaTreeCrawlHook } from "./graphSchema.node"
import { graphSchemaCrawlRules } from "./graphSchema.rules"
import { createTransformCrawlHook } from "../transform"
import { ModelTree } from "../modelTree"

export const createGraphSchemaTree = (schema: GraphSchemaFragment, source: any = schema): GraphSchemaModelTree => {
  const tree = new ModelTree<GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta>()
  const crawlState: GraphSchemaCrawlState = { parent: null, source }

  syncCrawl(
    schema,
    [ 
      createTransformCrawlHook(source), 
      createGraphSchemaTreeCrawlHook(tree)
    ], 
    { 
      state: crawlState, 
      rules: graphSchemaCrawlRules()
    }
  )

  return tree
}
