export const modelTreeNodeType = {
  simple: 'simple',
  oneOf: 'oneOf',
  anyOf: 'anyOf',
  allOf: 'allOf',
} as const

export const modelStateNodeType = {
  basic: 'basic',
  expandable: 'expandable',
  combinary: 'combinary'
} as const

export const changeTypes = ["breaking", "non-breaking", "annotation", "unclassified", "deprecated"] as const
