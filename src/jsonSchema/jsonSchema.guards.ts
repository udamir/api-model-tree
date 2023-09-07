import type { JsonSchemaFragment, JsonSchemaNodeType } from "./jsonSchema.types"
import { jsonSchemaNodeType } from "./jsonSchema.consts"

const VALID_TYPES = Object.values(jsonSchemaNodeType)

export const isValidType = (maybeType: unknown): maybeType is JsonSchemaNodeType =>
  typeof maybeType === 'string' && VALID_TYPES.includes(maybeType as JsonSchemaNodeType)

export function isDeprecated(fragment: JsonSchemaFragment): boolean {
  if ('x-deprecated' in fragment) {
    return fragment['x-deprecated'] === true
  }

  if ('deprecated' in fragment) {
    return fragment.deprecated === true
  }

  return false
}
