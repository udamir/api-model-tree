import type { DimDataNode, IDimTree, IDimRefNode, IDimTreeNode } from "./types"

export class DimTree<T extends object> implements IDimTree<T> {
  public nodes: Map<string, DimTreeNode<T>> = new Map()

  get root() {
    return this.nodes.size ? this.nodes.get('#')! : null
  }

  public createNode(parent: DimTreeNode<T> | null, id: string, type: string, value: T, dimention = ''): DimTreeNode<T> {
    const node = new DimTreeNode<T>(id, type, value, parent)
    this.nodes.set(id, node)
    parent?.addChild(node, dimention)
    return node
  }

  public createRefNode(parent: DimTreeNode<T>, id: string, target: DimTreeNode<T>, isCycle: boolean, dimention = ''): DimRefNode<T> {
    const node = new DimRefNode(id, target, isCycle, parent)
    parent.addChild(node, dimention)
    return node
  }

  public toJSON() {
    
  }
}

export class DimRefNode<T extends object> implements IDimRefNode<T> {
  public isRef: boolean = true 

  get type() {
    return this._target.type
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + 1
  }

  public get path(): ReadonlyArray<string> {
    return this.parent === null ? [this.id] : [...this.parent.path, this.id]
  }

  get value() {
    return this._target.value
  }

  get dimensions() {
    return this._target.dimensions
  }

  constructor(public id: string, private _target: DimTreeNode<T>, public isCycle: boolean, public parent: DimTreeNode<T>) {
    this.isCycle = isCycle
  }

  public children(dim?: string): DimDataNode<T>[] {
    return this._target.children(dim) || []
  }
}

export class DimTreeNode<T extends object> implements IDimTreeNode<T> {
  protected _childNodes: Map<string, DimDataNode<T>[]> = new Map()
  
  constructor(
    public id: string,
    public type: string,
    public value: T,
    public parent: DimTreeNode<T> | null = null
  ) {}

  public get path(): ReadonlyArray<string> {
    return this.parent === null ? [this.id] : [...this.parent.path, this.id]
  }

  public get depth(): number {
    return this.parent === null ? 0 : this.parent.depth + 1
  }

  public get dimensions() {
    return [...this._childNodes.keys()]
  }

  public children(dim: string = '') {
    return this._childNodes.get(dim) || []
  }

  public addChild(node: DimDataNode<T>, dimension = '') {
    if (this._childNodes.has(dimension)) {
      this._childNodes.get(dimension)!.push(node)
    } else {
      this._childNodes.set(dimension, [node])
    }
  }
}
