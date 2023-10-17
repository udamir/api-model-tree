import { isRefNode, jsonSchemaMergeRules, merge, resolveRefNode } from "allof-merge"

import { OpenApiCrawlState } from "./openapi.types"
import { SchemaTransformFunc } from "../types"

export const allOfMerge: SchemaTransformFunc<OpenApiCrawlState> = (value, path, {source}) => {
  const mergeRules = { "/schema": jsonSchemaMergeRules() }
  return merge(value, { source, mergeRefSibling: true, mergeCombinarySibling: true, rules: mergeRules })
}

export const resolveRef: SchemaTransformFunc<OpenApiCrawlState> = (value, path, {source}) => {
  if (isRefNode(value)) {
    return resolveRefNode(source, value)
  }
  return value
}

export const transformPathItems: SchemaTransformFunc<OpenApiCrawlState> = (value, path, {source}) => {
  // TODO: resolve $ref path items
  // TODO: copy path parameters to all methods
  // TODO: copy servers to all methods
  // TODO: copy summary/description to all methods
  return value
}

export const transformGlobalSecurity: SchemaTransformFunc<OpenApiCrawlState> = (value) => {
  // TODO: copy global security to operation
  return value
}
