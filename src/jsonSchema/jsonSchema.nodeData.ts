import { unwrapArrayOrNull, unwrapStringOrNull, getValidations, getTypes, getRequired, getPrimaryType, getAnnotations } from './jsonSchema.utils'
import { JsonSchemaAnnotations, JsonSchemaNodeType } from './jsonSchema.types'
import { IJsonSchemaNodeData, JsonSchemaFragment } from './jsonSchema.types'
import { jsonSchemaNodeType } from './jsonSchema.consts'
import { isDeprecated } from './jsonSchema.guards'

export class JsonSchemaNodeData implements IJsonSchemaNodeData {
  public readonly $id: string | null
  public readonly types: JsonSchemaNodeType[] | null
  public readonly primaryType: JsonSchemaNodeType | null

  public readonly required: string[] | null
  public readonly enum: unknown[] | null
  public readonly format: string | null
  public readonly title: string | null
  public readonly deprecated: boolean

  public readonly annotations: Readonly<Partial<Record<JsonSchemaAnnotations, unknown>>>
  public readonly validations: Readonly<Record<string, unknown>>

  constructor(public readonly fragment: JsonSchemaFragment) {

    this.$id = unwrapStringOrNull('id' in fragment ? fragment.id : fragment.$id)
    this.types = getTypes(fragment)
    this.primaryType = getPrimaryType(fragment, this.types)

    this.deprecated = isDeprecated(fragment)
    this.enum = 'const' in fragment ? [fragment.const] : unwrapArrayOrNull(fragment.enum)
    this.required = getRequired(fragment.required)
    this.format = unwrapStringOrNull(fragment.format)
    this.title = unwrapStringOrNull(fragment.title)

    this.annotations = getAnnotations(fragment)
    this.validations = getValidations(fragment, this.types)
  }

  public get simple() {
    return (
      this.primaryType !== jsonSchemaNodeType.Array && this.primaryType !== jsonSchemaNodeType.Object 
    )
  }

  public get unknown() {
    return (
      this.types === null &&
      this.format === null &&
      this.enum === null &&
      Object.keys(this.annotations).length + Object.keys(this.validations).length === 0
    )
  }

  public toJSON() {
    return JSON.parse(JSON.stringify(this))
  }
}
