import { graphSchemaNodeKind } from "../graphSchema";

export const graphApiNodeKinds = ['schema', 'directive', 'query', 'mutation', 'subscription']

export const graphApiNodeKind = {
  ...graphSchemaNodeKind,
  schema: 'schema',
  directive: 'directive',
  query: 'query',
  mutation: 'mutation',
  subscription: 'subscription',
} as const
