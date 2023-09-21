import { graphApiSchemaNodeKind } from './graphapiSchema.consts'

export type GraphapiSchemaNodeKind = keyof typeof graphApiSchemaNodeKind

export type GraphSchemaCrawlRule = {
  kind: GraphapiSchemaNodeKind
}

