import { JsonPath } from "json-crawl"
import type { ModelDataNode, IModelTree, IModelRefNode, IModelTreeNode } from "./types"

export class ModelTree<T extends object> implements IModelTree<T> {
  public nodes: Map<string, IModelTreeNode<T>> = new Map()

  get root() {
    return this.nodes.size ? this.nodes.get('#')! : null
  }

  public createNode(id: string, key: string | number, value: T, parent: ModelTreeNode<T> | null = null): ModelTreeNode<T> {
    const node = new ModelTreeNode<T>(id, key, value, parent)
    this.nodes.set(id, node)
    return node
  }

  public createComplexNode(id: string, key: string | number, type: string, parent: ModelTreeNode<T> | null = null): ModelTreeComplexNode<T> {
    const node = new ModelTreeComplexNode<T>(id, key, type, parent)
    this.nodes.set(id, node)
    return node
  }

  public createRefNode(id: string, key: string | number, target: IModelTreeNode<T>, isCycle: boolean, parent: ModelTreeNode<T>): ModelRefNode<T> {
    const node = new ModelRefNode(id, key, target, isCycle, parent)
    parent.addChild(node)
    return node
  }
}

export class ModelRefNode<T extends object> implements IModelRefNode<T> {
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
    return this._target.id
  }

  constructor(public id: string, public key: string | number, private _target: IModelTreeNode<T>, public isCycle: boolean, public parent: ModelTreeNode<T>) {
    this.isCycle = isCycle
  }

  public children(nested?: string): ModelDataNode<T>[] {
    return this._target.children(nested)
  }
}

export class ModelTreeComplexNode<T extends object> implements IModelTreeNode<T> {
  public nested: ModelDataNode<T>[] = []

  constructor(
    public id: string = "#",
    public key: string | number = "",
    public type: string,
    public parent: ModelTreeNode<T> | null = null
  ) {
  }

  public get path(): JsonPath {
    return this.parent === null ? [] : [...this.parent.path, this.key]
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + 1
  }

  private findNestedNode(nestedId: string): ModelDataNode<T> | null {
    for (const nested of this.nested) {
      if (nested.id === nestedId) {
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
    const nested = nestedId ? this.findNestedNode(nestedId) : this.nested[0]
    return nested?.value() ?? null
  }

  public addNestedNode(node: ModelDataNode<T>) {
    this.nested.push(node)
  }

  public children(nestedId?: string) {
    const nested = nestedId ? this.findNestedNode(nestedId) : this.nested[0]
    return nested?.children() || []
  }
}

export class ModelTreeNode<T extends object> implements IModelTreeNode<T> { 
  private _children: ModelDataNode<T>[] = []
  public nested: ModelDataNode<T>[] = []
  public type = 'simple'

  constructor(
    public id: string = "#",
    public key: string | number = "",
    private _value: T,
    public parent: ModelTreeNode<T> | null = null
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

  public addChild(node: ModelDataNode<T>) {
    this._children.push(node)
  }
}
