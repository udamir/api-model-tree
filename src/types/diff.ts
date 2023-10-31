// from api-smart-diff
export type ApiMergedMeta = {
  action: "add" | "remove" | "replace" | "test" | "rename"
  replaced?: any
  type: "breaking" | "non-breaking" | "annotation" | "unclassified" | "deprecated"
}

export type MergedArrayMeta = {
  array: {
    [key: number]: ApiMergedMeta | MergedArrayMeta
  }
}

export type ChangeMeta = ApiMergedMeta | MergedArrayMeta

export type DiffNodeValue = { 
  $changes?: Record<string, ChangeMeta>
}

export type DiffNodeMeta = { 
  $nodeChanges?: ChangeMeta
  $metaChanges?: Record<string, ChangeMeta>
  $childrenChanges?: Record<string, ChangeMeta>
  $nestedChanges?: Record<string, ChangeMeta>
}
