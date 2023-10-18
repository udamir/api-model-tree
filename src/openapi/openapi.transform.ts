import { isRefNode, jsonSchemaMergeRules, merge, resolveRefNode } from "allof-merge"

import { OpenApiCrawlState } from "./openapi.types"
import { SchemaTransformFunc } from "../types"
import { isKey, objectKeys } from "../utils"

export const allOfMerge: SchemaTransformFunc<OpenApiCrawlState> = (value, path, {source}) => {
  const mergeRules = { "/schema": jsonSchemaMergeRules() }
  return merge(value, { source, mergeRefSibling: true, mergeCombinarySibling: true, rules: mergeRules })
}

export const resolveRef: SchemaTransformFunc<OpenApiCrawlState> = (value, path, {source}) => {
  return isRefNode(value) ? resolveRefNode(source, value) : value
}

export const transformPathItems: SchemaTransformFunc<OpenApiCrawlState> = (value) => {
  if (typeof value !== 'object' || !value) { return value }
  
  const result: Record<string, any> = {...value}

  const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']
  
  const _value = objectKeys(result).reduce((res, key) => {
    if (methods.includes(key)) { return res }
    res[key] = result[key]
    return res
  }, {} as any)

  if (!objectKeys(_value).length) {
    return value
  }

  for (const method of methods) {
    if (!isKey(result, method)) { continue }
    const data = { ...result[method] }

    const { parameters, servers, ...rest } = _value

    // copy path parameters to all methods
    if (parameters && Array.isArray(parameters)) {
      if ('parameters' in data && Array.isArray(data.parameters)) {
        data.parameters = [...data.parameters, ...parameters]
      } else {
        data.parameters = parameters
      }
    }
    
    // copy servers to all methods
    if (servers && Array.isArray(servers)) {
      if ('servers' in data && Array.isArray(data.servers)) {
        data.servers = [...data.servers, ...servers]
      } else {
        data.servers = servers
      }
    }

    // copy summary/description and rest to all methods
    for (const key of objectKeys(rest)) {
      if (isKey(data, key)) { continue }
      data[key] = rest[key]
    }

    result[method] = data
  }
  
  return result
}

export const transformGlobalSecurity: SchemaTransformFunc<OpenApiCrawlState> = (value) => {
  // TODO: copy global security to operation
  return value
}
