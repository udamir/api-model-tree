import { syncCrawl } from "json-crawl"

import { GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta, GraphSchemaNodeType, GraphSchemaCrawlRule } from "./graphSchema.types"
import { JsonSchemaCreateNodeParams, JsonSchemaModelDiffTree, isRequired } from "../jsonSchema"
import { CreateNodeResult, ChangeMeta, DiffNodeMeta, DiffNodeValue, ModelDataNode } from "../types"
import { graphSchemaNodeMetaProps, graphSchemaNodeValueProps } from "./graphSchema.consts"
import { createGraphSchemaTreeCrawlHook } from "./graphSchema.build"
import { getNodeComplexityType, objectKeys, pick } from "../utils"
import { graphSchemaCrawlRules } from "./graphSchema.rules"
import { ModelTreeComplexNode } from "../modelTree"

export type GraphSchemaDiffTreeNode<T extends GraphSchemaNodeType = any> = ModelDataNode<
  GraphSchemaDiffNodeValue<T>,
  GraphSchemaNodeKind,
  GraphSchemaDiffNodeMeta
>
export type GraphSchemaComplexDiffNode<T extends GraphSchemaNodeType = any> = ModelTreeComplexNode<
  GraphSchemaDiffNodeValue<T>,
  GraphSchemaNodeKind,
  GraphSchemaDiffNodeMeta
>

export type GraphSchemaDiffCrawlState = { 
  parent: GraphSchemaDiffTreeNode | null
  container?: GraphSchemaComplexDiffNode
}

export type GraphSchemaDiffNodeValue<T extends GraphSchemaNodeType = any> = GraphSchemaNodeValue<T> & DiffNodeValue
export type GraphSchemaDiffNodeMeta = GraphSchemaNodeMeta & DiffNodeMeta

export class GraphSchemaModelDiffTree<
  T = GraphSchemaDiffNodeValue,
  K extends string = GraphSchemaNodeKind,
  M extends object = GraphSchemaDiffNodeMeta
> extends JsonSchemaModelDiffTree<T, K, M> {

  public simpleDiffMeta (params: JsonSchemaCreateNodeParams<T, K, GraphSchemaDiffNodeMeta>) {
    const { value, id, key = "", parent = null, container = null } = params

    const requiredChange = this.getRequiredChange(key, parent)
    const $metaChanges = {
      ...requiredChange ? { required: requiredChange } : {},
      ...pick(value?.[this.metaKey], graphSchemaNodeMetaProps),
    }
    const $childrenChanges = this.getChildrenChanges(id, value ?? {})
    const $nodeChanges = parent?.meta?.$childrenChanges?.[id] || container?.meta?.$nestedChanges?.[id]
  
    return {
      ...pick<any>(value, graphSchemaNodeMetaProps),
      ...$nodeChanges ? { $nodeChanges } : {},
      ...Object.keys($metaChanges).length ? { $metaChanges } : {},
      ...Object.keys($childrenChanges).length ? { $childrenChanges } : {},
      required: isRequired(key, parent),
      _fragment: value,
    }
  }
  
  public nestedDiffMeta (params: JsonSchemaCreateNodeParams<T, K, GraphSchemaDiffNodeMeta>) {
    const { value, id, key = "", parent = null } = params

    const complexityType = getNodeComplexityType(value)
    const nestedChanges: Record<string, any> = value?.[this.metaKey]?.[complexityType]?.array ?? {}

    const $nestedChanges: Record<string, ChangeMeta> = {}
    for (const nested of objectKeys(nestedChanges)) {
      $nestedChanges[`${id}/${complexityType}/${nested}`] = nestedChanges[nested]
    }

    return { 
      ...Object.keys($nestedChanges).length ? { $nestedChanges } : {},
      required: isRequired(key, parent),
      _fragment: value
    }
  }

  public createNodeValue(params: JsonSchemaCreateNodeParams<T, K, M>): T {
    const { value, id } = params
    const { type } = value
    if (!type || typeof type !== 'string') { 
      throw new Error (`Schema should have type: ${id}`)
    }
    const valueChanges = pick(value[this.metaKey], graphSchemaNodeValueProps[type])

    const _value = {
      ...pick<any>(value, graphSchemaNodeValueProps[type]),
      ...Object.keys(valueChanges).length ? { $changes: valueChanges } : {}
    }

    return _value as T
  }

  public createGraphSchemaNode (
    params: JsonSchemaCreateNodeParams<T, K, M>
  ): CreateNodeResult<ModelDataNode<T, K, M>> {
    return this.createJsonSchemaNode(params)
  }
}

export const createGraphSchemaDiffTree = (schema: any, metaKey: symbol, source: any = schema): GraphSchemaModelDiffTree => {
  const tree = new GraphSchemaModelDiffTree(source, metaKey)
  const crawlState: GraphSchemaDiffCrawlState = { parent: null }

  syncCrawl<GraphSchemaDiffCrawlState, GraphSchemaCrawlRule>(
    schema,
    [ 
      createGraphSchemaTreeCrawlHook(tree)
    ], 
    { 
      state: crawlState, 
      rules: graphSchemaCrawlRules()
    }
  )

  return tree
}