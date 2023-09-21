import { graphSchemaNodeKind } from "../graphSchema";

export const graphApiSchemaNodeKind = {
  ...graphSchemaNodeKind,
  schema: 'schema',
  directives: 'directives',
  directive: 'directive',
  query: 'query',
  mutation: 'mutation',
  subsription: 'subsription',
} as const
