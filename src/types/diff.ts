import { JsonPath } from "json-crawl"

// from api-smart-diff
export type Diff = {
  action: "add" | "remove" | "replace" | "test" | "rename"
  path: JsonPath
  before?: any
  after?: any
  type: "breaking" | "non-breaking" | "annotation" | "unclassified" | "deprecated"
  description?: string
}

export type DiffNodeValue = { 
  $changes?: Record<string, Diff>
}

export type DiffNodeMeta = { 
  $nodeChanges?: Diff
  $metaChanges?: Record<string, Diff>
  $childrenChanges?: Record<string, Diff>
  $nestedChanges?: Record<string, Diff>
}
