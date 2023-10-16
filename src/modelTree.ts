import { JsonPath } from "json-crawl"

import type { ModelDataNode, IModelTree, IModelRefNode, IModelTreeNode, ModelTreeNodeType, ModelTreeNodeParams } from "./types"
import { modelTreeNodeType } from "./consts"

export class ModelTree<T extends object, K extends string, M> implements IModelTree<T, K, M> {
  public nodes: Map<string, IModelTreeNode<T, K, M>> = new Map()

  get root() {
    return this.nodes.size ? this.nodes.get('#')! : null
  }

  public createNode(id: string, kind: K, key: string | number, params?: ModelTreeNodeParams<T, K, M>): ModelTreeNode<T, K, M> {
    const node = new ModelTreeNode<T, K, M>(id, kind, key, params)
    this.nodes.set(id, node)
    return node
  }

  public createComplexNode(id: string, kind: K, key: string | number, params: ModelTreeNodeParams<T, K, M> & { type: Exclude<ModelTreeNodeType, "simple"> }): ModelTreeComplexNode<T, K, M> {
    const node = new ModelTreeComplexNode<T, K, M>(id, kind, key, params)
    this.nodes.set(id, node)
    return node
  }

  public createRefNode(id: string, kind: K, key: string | number, target: ModelDataNode<T, K, M>, params: ModelTreeNodeParams<T, K, M>): ModelRefNode<T, K, M> {
    const node = new ModelRefNode<T, K, M>(id, kind, key, target, params)
    return node
  }
}

export class ModelTreeNode<T extends object, K extends string, M> implements IModelTreeNode<T, K, M> { 
  private readonly _children: ModelDataNode<T, K, M>[] = []
  public nested: ModelDataNode<T, K, M>[] = []
  private readonly _value: T | null = null
  public readonly parent: IModelTreeNode<T, K, M> | null = null
  public readonly meta: M = {} as M
  protected readonly _countInDepth: boolean

  public readonly type: ModelTreeNodeType = modelTreeNodeType.simple

  constructor(
    public readonly id: string = "#",
    public readonly kind: K,
    public readonly key: string | number = "",
    params?: ModelTreeNodeParams<T, K, M>
  ) {
    const { type = modelTreeNodeType.simple, value = null, parent = null, countInDepth = true, meta } = params ?? {}
    this._value = value
    this.type = type
    this.parent = parent
    this._countInDepth = countInDepth
    this.meta = meta as M
  }

  public get path(): JsonPath {
    return this.parent === null ? [] : [...this.parent.path, this.key]
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + (this._countInDepth ? 1 : 0)
  }

  public nestedNode(nestedId?: string, deep = false): ModelDataNode<T, K, M> | null {
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

  public addChild(node: ModelDataNode<T, K, M>) {
    this._children.push(node)
  }

  public addNestedNode(node: ModelDataNode<T, K, M>) {
    this.nested.push(node)
  }
}

export class ModelTreeComplexNode<T extends object, K extends string, M> extends ModelTreeNode<T, K, M> {

  constructor(
    public readonly id: string = "#",
    public readonly kind: K,
    public readonly key: string | number = "",
    params: ModelTreeNodeParams<T, K, M> & { type: Exclude<ModelTreeNodeType, "simple"> }
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

export class ModelRefNode<T extends object, K extends string, M> extends ModelTreeNode<T, K, M>  implements IModelRefNode<T, K, M> {
  private _target: ModelDataNode<T, K, M>

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
    let parent: ModelDataNode<T, K, M> | null  = this.parent
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
    _target: ModelDataNode<T, K, M>,
    params: ModelTreeNodeParams<T, K, M>
  ) {
    super(id, kind, key, { ...params, type: _target.type })
    this._target = _target instanceof ModelRefNode ? _target._target : _target
    this.nested = this._target.nested
  }

  public children(nested?: string): ModelDataNode<T, K, M>[] {
    const children = this._target.children(nested)
    return children.map((child) => new ModelRefNode(child.id, child.kind, child.key, child, { parent: this, meta: child.meta }))
  }

  public nestedNode(nestedId?: string): ModelDataNode<T, K, M> | null {
    return this._target.nestedNode(nestedId)
  }
}
