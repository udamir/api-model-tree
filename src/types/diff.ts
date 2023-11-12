import { changeTypes } from "../consts"

// from api-smart-diff
export type ChangeType = typeof changeTypes[number]

export type ApiMergedMeta = {
  action: "add" | "remove" | "replace" | "test" | "rename"
  replaced?: any
  type: ChangeType
}

export type MergedArrayMeta = {
  array: Record<number, ApiMergedMeta | MergedArrayMeta>
}

export type ChangeMeta = ApiMergedMeta | MergedArrayMeta

export type NodeChange = ApiMergedMeta & { depth: number }
export type NodeChangesSummary = Partial<Record<ChangeType, number>>

export type DiffNodeMeta = { 
  $nodeChange?: NodeChange 
  $nodeChangesSummary: () => NodeChangesSummary
  $metaChanges?: Record<string, ChangeMeta>
  $childrenChanges?: Record<string, ApiMergedMeta>
  $nestedChanges?: Record<string, ApiMergedMeta>
}

export type DiffNodeValue = { 
  $changes?: Record<string, ChangeMeta>
}
