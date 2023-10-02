import { JsonPath } from "json-crawl"

import type { ModelDataNode, IModelTree, IModelRefNode, IModelTreeNode, ModelTreeNodeType } from "./types"
import { modelTreeNodeType } from "./consts"

export class ModelTree<T extends object, K extends string> implements IModelTree<T, K> {
  public nodes: Map<string, IModelTreeNode<T, K>> = new Map()

  get root() {
    return this.nodes.size ? this.nodes.get('#')! : null
  }

  public createNode(id: string, kind: K, key: string | number, value: T | null, parent: ModelTreeNode<T, K> | null = null, required = false, count = true): ModelTreeNode<T, K> {
    const node = new ModelTreeNode<T, K>(id, kind, key, value, parent, required, count)
    this.nodes.set(id, node)
    return node
  }

  public createComplexNode(id: string, kind: K, key: string | number, type: ModelTreeNodeType, parent: ModelTreeNode<T, K> | null = null, required = false): ModelTreeComplexNode<T, K> {
    const node = new ModelTreeComplexNode<T, K>(id, kind, key, type, parent, required)
    this.nodes.set(id, node)
    return node
  }

  public createRefNode(id: string, kind: K, key: string | number, target: IModelTreeNode<T, K>, parent: IModelTreeNode<T, K> | null, required = false): ModelRefNode<T, K> {
    const node = new ModelRefNode(id, kind, key, target, parent, required)
    return node
  }
}

export class ModelRefNode<T extends object, K extends string> implements IModelRefNode<T, K> {
  get type() {
    return this._target.type
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + (this._countInDepth ? 1 : 0)
  }

  public get path(): JsonPath {
    return this.parent === null ? [] : [...this.parent.path, this.key]
  }

  public value(nested?: string) {
    return this._target.value(nested)
  }

  get nested() {
    return this._target.nested
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
    private _target: ModelDataNode<T, K>,
    public readonly parent: ModelDataNode<T, K> | null,
    public readonly required = false,
    private _countInDepth = true
  ) {}

  public children(nested?: string): ModelDataNode<T, K>[] {
    const children = this._target.children(nested)
    return children.map((child) => new ModelRefNode(child.id, child.kind, child.key, child, this))
  }

  public nestedNode(nestedId?: string): ModelDataNode<T, K> | null {
    return this._target.nestedNode(nestedId)
  }
}

export class ModelTreeNode<T extends object, K extends string> implements IModelTreeNode<T, K> { 
  private _children: ModelDataNode<T, K>[] = []
  public readonly nested: ModelDataNode<T, K>[] = []
  public readonly type: ModelTreeNodeType = modelTreeNodeType.simple

  constructor(
    public readonly id: string = "#",
    public readonly kind: K,
    public readonly key: string | number = "",
    private _value: T | null,
    public readonly parent: ModelTreeNode<T, K> | null = null,
    public readonly required = false,
    private _countInDepth = true
  ) {
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
}

export class ModelTreeComplexNode<T extends object, K extends string> extends ModelTreeNode<T, K> {

  constructor(
    public readonly id: string = "#",
    public readonly kind: K,
    public readonly key: string | number = "",
    public readonly type: ModelTreeNodeType,
    public readonly parent: ModelTreeNode<T, K> | null = null,
    public readonly required = false
  ) {
    super(id, kind, key, null, parent, required)
  }

  public value(nestedId?: string): T | null {
    const nested = this.nestedNode(nestedId, true)
    return nested?.value() ?? null
  }

  public addNestedNode(node: ModelDataNode<T, K>) {
    this.nested.push(node)
  }

  public children(nestedId?: string) {
    const nested = this.nestedNode(nestedId, true)
    return nested?.children() || []
  }
}
