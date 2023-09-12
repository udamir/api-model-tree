import { JsonPath } from "json-crawl"

import type { ModelDataNode, IModelTree, IModelRefNode, IModelTreeNode, ModelDataNodeType } from "./types"
import { modelTreeNodeType } from "./consts"

export class ModelTree<T extends object, K extends string> implements IModelTree<T, K> {
  public nodes: Map<string, IModelTreeNode<T, K>> = new Map()

  get root() {
    return this.nodes.size ? this.nodes.get('#')! : null
  }

  public createNode(id: string, kind: K, key: string | number, value: T | null, parent: ModelTreeNode<T, K> | null = null): ModelTreeNode<T, K> {
    const node = new ModelTreeNode<T, K>(id, kind, key, value, parent)
    this.nodes.set(id, node)
    return node
  }

  public createComplexNode(id: string, kind: K, key: string | number, type: ModelDataNodeType, parent: ModelTreeNode<T, K> | null = null): ModelTreeComplexNode<T, K> {
    const node = new ModelTreeComplexNode<T, K>(id, kind, key, type, parent)
    this.nodes.set(id, node)
    return node
  }

  public createRefNode(id: string, kind: K, key: string | number, target: IModelTreeNode<T, K>, parent: ModelTreeNode<T, K>): ModelRefNode<T, K> {
    const node = new ModelRefNode(id, kind, key, target, parent)
    parent.addChild(node)
    return node
  }
}

export class ModelRefNode<T extends object, K extends string> implements IModelRefNode<T, K> {
  get type() {
    return this._target.type
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + 1
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
    public id: string,
    public kind: K,
    public key: string | number,
    private _target: ModelDataNode<T, K>,
    public parent: ModelDataNode<T, K>
  ) {}

  public children(nested?: string): ModelDataNode<T, K>[] {
    const children = this._target.children(nested)
    return children.map((child) => new ModelRefNode(child.id, child.kind, child.key, child, this))
  }
}

export class ModelTreeComplexNode<T extends object, K extends string> implements IModelTreeNode<T, K> {
  public nested: ModelDataNode<T, K>[] = []

  constructor(
    public id: string = "#",
    public kind: K,
    public key: string | number = "",
    public type: ModelDataNodeType,
    public parent: ModelTreeNode<T, K> | null = null
  ) {
  }

  public get path(): JsonPath {
    return this.parent === null ? [] : [...this.parent.path, this.key]
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + 1
  }

  private findNestedNode(nestedId?: string): ModelDataNode<T, K> | null {
    for (const nested of this.nested) {
      if (!nestedId || nested.id === nestedId) {
        return nested
      }
      if (nested instanceof ModelTreeComplexNode) {
        const node = nested.findNestedNode(nestedId)
        if (node) { return node }
      }
    }

    return null
  }

  public value(nestedId?: string): T | null {
    const nested = this.findNestedNode(nestedId)
    return nested?.value() ?? null
  }

  public addNestedNode(node: ModelDataNode<T, K>) {
    this.nested.push(node)
  }

  public children(nestedId?: string) {
    const nested = this.findNestedNode(nestedId)
    return nested?.children() || []
  }
}

export class ModelTreeNode<T extends object, K extends string> implements IModelTreeNode<T, K> { 
  private _children: ModelDataNode<T, K>[] = []
  public nested: ModelDataNode<T, K>[] = []
  public type = modelTreeNodeType.simple

  constructor(
    public id: string = "#",
    public kind: K,
    public key: string | number = "",
    private _value: T | null,
    public parent: ModelTreeNode<T, K> | null = null
  ) {
  }

  public get path(): JsonPath {
    return this.parent === null ? [] : [...this.parent.path, this.key]
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + 1
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
