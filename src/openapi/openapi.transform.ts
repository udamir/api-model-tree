import { jsonSchemaMergeRules, merge } from "allof-merge"

import { OpenApiCrawlState } from "./openapi.types"
import { SchemaTransformFunc } from "../types"

export const allOfMerge: SchemaTransformFunc<OpenApiCrawlState> = (value, path, {source}) => {
  const mergeRules = { "/schema": jsonSchemaMergeRules() }
  return merge(value, { source, mergeRefSibling: true, mergeCombinarySibling: true, rules: mergeRules })
}

export const transformPathParameters: SchemaTransformFunc<OpenApiCrawlState> = (value) => {
  // TODO: copy path parameters to all methods
  return value
}

export const transformGlobalSecurity: SchemaTransformFunc<OpenApiCrawlState> = (value) => {
  // TODO: copy global security to operation
  return value
}

export const transformParameterToJsonSchema: SchemaTransformFunc<OpenApiCrawlState> = (value) => {
  return value
}

export const transformContentToJsonSchema: SchemaTransformFunc<OpenApiCrawlState> = (value) => {
  return value
}
