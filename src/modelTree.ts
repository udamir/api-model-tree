import { JsonPath } from "json-crawl"

import type { ModelDataNode, IModelTree, IModelRefNode, IModelTreeNode, ModelTreeNodeType, ModelTreeNodeParams } from "./types"
import { modelTreeNodeType } from "./consts"

export class ModelTree<T extends object, K extends string, D = any> implements IModelTree<T, K> {
  public nodes: Map<string, IModelTreeNode<T, K, D>> = new Map()

  get root() {
    return this.nodes.size ? this.nodes.get('#')! : null
  }

  public createNode(id: string, kind: K, key: string | number, params?: ModelTreeNodeParams<T, K, D>): ModelTreeNode<T, K, D> {
    const node = new ModelTreeNode<T, K, D>(id, kind, key, params)
    this.nodes.set(id, node)
    return node
  }

  public createComplexNode(id: string, kind: K, key: string | number, params: ModelTreeNodeParams<T, K, D> & { type: Exclude<ModelTreeNodeType, "simple"> }): ModelTreeComplexNode<T, K, D> {
    const node = new ModelTreeComplexNode<T, K, D>(id, kind, key, params)
    this.nodes.set(id, node)
    return node
  }

  public createRefNode(id: string, kind: K, key: string | number, target: ModelDataNode<T, K, D>, params: ModelTreeNodeParams<T, K, D>): ModelRefNode<T, K, D> {
    const node = new ModelRefNode<T, K, D>(id, kind, key, target, params)
    return node
  }
}

export class ModelTreeNode<T extends object, K extends string, D = any> implements IModelTreeNode<T, K> { 
  private readonly _children: ModelDataNode<T, K, D>[] = []
  public nested: ModelDataNode<T, K, D>[] = []
  private readonly _value: T | null = null
  public readonly parent: IModelTreeNode<T, K, D> | null = null
  public readonly data: D = {} as D
  protected readonly _countInDepth: boolean

  public readonly type: ModelTreeNodeType = modelTreeNodeType.simple

  constructor(
    public readonly id: string = "#",
    public readonly kind: K,
    public readonly key: string | number = "",
    params?: ModelTreeNodeParams<T, K, D>
  ) {
    const { type = modelTreeNodeType.simple, value = null, parent = null, countInDepth = true, ...data } = params ?? {}
    this._value = value
    this.type = type
    this.parent = parent
    this._countInDepth = countInDepth
    this.data = data as D
  }

  public get path(): JsonPath {
    return this.parent === null ? [] : [...this.parent.path, this.key]
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + (this._countInDepth ? 1 : 0)
  }

  public nestedNode(nestedId?: string, deep = false): ModelDataNode<T, K> | null {
    if (!nestedId && this.nested.length) {
      return this.nested[0]
    }

    for (const nested of this.nested) {
      if (nested.id === nestedId) {
        return nested
      }
      if (deep && nested instanceof ModelTreeComplexNode) {
        const node = nested.nestedNode(nestedId, deep)
        if (node) { return node }
      }
    }

    return null
  }

  public value(nestedId?: string): T | null {
    return nestedId ? null : this._value
  }

  public children(nestedId?: string) {
    return nestedId ? [] : this._children
  }

  public addChild(node: ModelDataNode<T, K>) {
    this._children.push(node)
  }

  public addNestedNode(node: ModelDataNode<T, K>) {
    this.nested.push(node)
  }
}

export class ModelTreeComplexNode<T extends object, K extends string, D = any> extends ModelTreeNode<T, K, D> {

  constructor(
    public readonly id: string = "#",
    public readonly kind: K,
    public readonly key: string | number = "",
    params: ModelTreeNodeParams<T, K, D> & { type: Exclude<ModelTreeNodeType, "simple"> }
  ) {
    super(id, kind, key, params)
  }
  public value(nestedId?: string): T | null {
    const nested = this.nestedNode(nestedId, true)
    return nested?.value() ?? null
  }

  public children(nestedId?: string) {
    const nested = this.nestedNode(nestedId, true)
    return nested?.children() || []
  }
}

export class ModelRefNode<T extends object, K extends string, D = any> extends ModelTreeNode<T, K, D>  implements IModelRefNode<T, K, D> {
  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + (this._countInDepth ? 1 : 0)
  }

  public get path(): JsonPath {
    return this.parent === null ? [] : [...this.parent.path, this.key]
  }

  public value(nested?: string) {
    return this._target.value(nested)
  }

  get ref() {
    return 'ref' in this._target ? this._target.ref : this._target.id
  }

  get isCycle() {
    let parent: ModelDataNode<T, K> | null  = this.parent
    const ref = this.ref
    while (parent) {
      if ("ref" in parent && parent.ref === ref || parent.id === ref) {
        return true
      }
      parent = parent.parent
    }
    return false
  }

  constructor(
    public readonly id: string,
    public readonly kind: K,
    public readonly key: string | number,
    private _target: ModelDataNode<T, K, D>,
    params: ModelTreeNodeParams<T, K, D>
  ) {
    super(id, kind, key, { ...params, type: _target.type })
    this.nested = _target.nested
  }

  public children(nested?: string): ModelDataNode<T, K>[] {
    const children = this._target.children(nested)
    return children.map((child) => new ModelRefNode(child.id, child.kind, child.key, child, { parent: this }))
  }

  public nestedNode(nestedId?: string): ModelDataNode<T, K> | null {
    return this._target.nestedNode(nestedId)
  }
}
