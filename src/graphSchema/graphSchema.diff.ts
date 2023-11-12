import { syncCrawl } from "json-crawl"

import { GraphSchemaNodeValue, GraphSchemaNodeKind, GraphSchemaNodeMeta, GraphSchemaNodeType } from "./graphSchema.types"
import { CreateNodeResult, DiffNodeMeta, DiffNodeValue, ModelDataNode, ApiMergedMeta } from "../types"
import { JsonSchemaCreateNodeParams, JsonSchemaModelDiffTree, isRequired } from "../jsonSchema"
import { graphSchemaNodeMetaProps, graphSchemaNodeValueProps } from "./graphSchema.consts"
import { createGraphSchemaTreeCrawlHook } from "./graphSchema.build"
import { getNodeComplexityType, objectKeys, pick } from "../utils"
import { ModelTreeComplexNode, ModelTreeNode } from "../modelTree"
import { graphSchemaCrawlRules } from "./graphSchema.rules"

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
  parent: ModelTreeNode<GraphSchemaDiffNodeValue,GraphSchemaNodeKind,GraphSchemaDiffNodeMeta>  | null
  container?: GraphSchemaComplexDiffNode
}

export type GraphSchemaDiffNodeValue<T extends GraphSchemaNodeType = any> = GraphSchemaNodeValue<T> & DiffNodeValue
export type GraphSchemaDiffNodeMeta = GraphSchemaNodeMeta & DiffNodeMeta

export class GraphSchemaModelDiffTree<
  T extends DiffNodeValue = GraphSchemaDiffNodeValue,
  K extends string = GraphSchemaNodeKind,
  M extends DiffNodeMeta = GraphSchemaDiffNodeMeta
> extends JsonSchemaModelDiffTree<T, K, M> {

  public simpleDiffMeta (params: JsonSchemaCreateNodeParams<T, K, M>): GraphSchemaDiffNodeMeta {
    const { value, id, key = "", parent = null } = params

    const requiredChange = this.getRequiredChange(key, parent)
    const $metaChanges = {
      ...requiredChange ? { required: requiredChange } : {},
      ...pick(value?.[this.metaKey], graphSchemaNodeMetaProps),
    }
    const $childrenChanges = this.getChildrenChanges(id, value ?? {})
    const $nodeChange = this.getNodeChange(params)

    return {
      ...pick<any>(value, graphSchemaNodeMetaProps),
      ...$nodeChange ? { $nodeChange } : {},
      ...Object.keys($metaChanges).length ? { $metaChanges } : {},
      ...Object.keys($childrenChanges).length ? { $childrenChanges } : {},
      $nodeChangesSummary: () => ({}),
      required: isRequired(key, parent),
      _fragment: value,
    }
  }

  protected getNodeChange = (params: JsonSchemaCreateNodeParams<T, K, M>) => {
    const { id, parent = null, container = null } = params
    const inheretedChanges = container?.meta?.$nodeChange ?? parent?.meta.$nodeChange
    const nodeChanges = parent?.meta?.$childrenChanges?.[id] || container?.meta?.$nestedChanges?.[id]
  
    return ['add', 'remove'].includes(inheretedChanges?.action ?? "") ? inheretedChanges : nodeChanges 
        ? { ...nodeChanges, depth: (parent?.depth ?? 0) + (params.countInDepth ? 1 : 0) } : undefined
  }
  
  public nestedDiffMeta (params: JsonSchemaCreateNodeParams<T, K, M>): GraphSchemaDiffNodeMeta {
    const { value, id, key = "", parent = null } = params

    const complexityType = getNodeComplexityType(value)
    const nestedChanges: Record<string, any> = value?.[this.metaKey]?.[complexityType]?.array ?? {}

    const $nestedChanges: Record<string, ApiMergedMeta> = {}
    for (const nested of objectKeys(nestedChanges)) {
      $nestedChanges[`${id}/${complexityType}/${nested}`] = nestedChanges[nested]
    }

    const $nodeChange = this.getNodeChange(params)

    return { 
      ...Object.keys($nestedChanges).length ? { $nestedChanges } : {},
      ...$nodeChange ? { $nodeChange } : {},
      $nodeChangesSummary: () => ({}),
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

  syncCrawl(
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
