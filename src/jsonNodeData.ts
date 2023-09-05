import { getAnnotations } from './accessors/getAnnotations';
import { getPrimaryType } from './accessors/getPrimaryType';
import { getRequired } from './accessors/getRequired';
import { getTypes } from './accessors/getTypes';
import { getValidations } from './accessors/getValidations';
import { isDeprecated } from './accessors/isDeprecated';
import { unwrapArrayOrNull, unwrapStringOrNull } from './accessors/unwrap';
import type { IJsonNodeData, SchemaFragment } from './types';

import { SchemaAnnotations, SchemaNodeKind } from './consts';

export class JsonNodeData implements IJsonNodeData {
  public readonly $id: string | null;
  public readonly types: SchemaNodeKind[] | null;
  public readonly primaryType: SchemaNodeKind | null; 

  public readonly required: string[] | null;
  public readonly enum: unknown[] | null;
  public readonly format: string | null; 
  public readonly title: string | null;
  public readonly deprecated: boolean;

  public readonly annotations: Readonly<Partial<Record<SchemaAnnotations, unknown>>>;
  public readonly validations: Readonly<Record<string, unknown>>;

  constructor(public readonly fragment: SchemaFragment) {

    this.$id = unwrapStringOrNull('id' in fragment ? fragment.id : fragment.$id);
    this.types = getTypes(fragment);
    this.primaryType = getPrimaryType(fragment, this.types);

    this.deprecated = isDeprecated(fragment);
    this.enum = 'const' in fragment ? [fragment.const] : unwrapArrayOrNull(fragment.enum);
    this.required = getRequired(fragment.required);
    this.format = unwrapStringOrNull(fragment.format);
    this.title = unwrapStringOrNull(fragment.title);

    this.annotations = getAnnotations(fragment);
    this.validations = getValidations(fragment, this.types);
  }

  public get simple() {
    return (
      this.primaryType !== SchemaNodeKind.Array && this.primaryType !== SchemaNodeKind.Object 
    );
  }

  public get unknown() {
    return (
      this.types === null &&
      this.format === null &&
      this.enum === null &&
      Object.keys(this.annotations).length + Object.keys(this.validations).length === 0
    );
  }

  public toJSON() {
    return JSON.parse(JSON.stringify(this))
  }
}
