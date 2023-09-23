import { IModelTree, ModelDataNode } from "./types"

export type ModelStateNode<T> = ModelStateCombinerNode<T> | ModelStatePropNode<T>

export class ModelStateBaseNode<T>{
  protected _selected: string | undefined
  protected _children: ModelStateNode<T>[] = []

  public readonly type: string = 'base'

  get selected () {
    return this._selected
  }

  set selected (value: string | undefined) {
    this._selected = value
  }

  get children(): ModelStateNode<T>[] {
    return this.expanded ? this._children : []
  }

  get childrenTotal(): number {
    return this._children.reduce((res, curr) => res + curr.childrenTotal, this._children.length)
  }

  public allChildren(): ModelStateNode<T>[] {
    const _childrent = []

    for (let child of this.children) {
      _childrent.push(child, ...child.allChildren())
    }

    return _childrent
  }

  constructor(public readonly first = false, public expanded = false) {
  }

}

export class ModelStateCombinerNode<T> extends ModelStateBaseNode<T> {

  public readonly type: string = 'combinary'

  constructor (public node: ModelDataNode<T, any>, private _parent: ModelStateBaseNode<T>) {
    super(true, true)
    this._children = this.buildChildren()
  }
  
  protected buildChildren() {
    // convert nested to children
    const nested = this.node?.nestedNode(this.selected)
    return nested?.nested.length ? [new ModelStateCombinerNode(nested, this._parent)] : []
  }

  get selected() {
    if (!this._selected && this.node.nested.length) {
      return this.node.nested[0].id
    }
    return this._selected
  }

  public select(id: string) {
    if (id === this.selected) { return }
    this._selected = id
    this._parent.selected = id
    this._children = this.buildChildren()
  }
}

export class ModelStatePropNode<T> extends ModelStateBaseNode<T>{
  private _expandDepth: number

  private _argNodes: ModelStateNode<T>[] = []
  private _combinaryNodes: ModelStateNode<T>[] = []
  private _childrenNodes: ModelStateNode<T>[] = []

  public readonly type: string = 'property'
  
  get selected() {
    return this._selected
  }

  get children(): ModelStateNode<T>[] {
    return this.expanded ? [...this._argNodes, ...this._combinaryNodes, ...this._childrenNodes] : []
  }

  set selected (value: string | undefined) {
    if (value !== this._selected) {
      this._selected = value
      this.buildChildrenNodes()
    }
  }

  get value(): T | null {
    return this.node.value(this.selected)
  }

  constructor (public node: ModelDataNode<T, any>, _expandDepth = 1, first = false) {
    super(first, _expandDepth > 0)
    this._expandDepth = _expandDepth < 0 ? 0 : _expandDepth
    this._children = this.buildChildren()
  }

  private buildArgNodes() {
    const { nested } = this.node
    if (!nested[-1]) { return [] }
    // convert nested args to children
    const argList = nested[-1].children() ?? []
    this._argNodes = argList.length ? argList.map((arg, i) => new ModelStatePropNode(arg, this._expandDepth - 1, i === 0)) : []
    return this._argNodes
  }

  private buildCombinaryNodes() {
    if (!this.node.nested.length) { return []}
    // convert nested to children
    this._combinaryNodes = [new ModelStateCombinerNode(this.node, this)]
    return this._combinaryNodes
  }

  private buildChildrenNodes(): ModelStateNode<T>[] {
    const children = this.node.children(this.selected)
    this._childrenNodes = children.length ? children.map((prop) => new ModelStatePropNode(prop)) : []
    return this._childrenNodes
  }

  protected buildChildren(): ModelStateNode<T>[] {
    return [...this.buildArgNodes(), ...this.buildCombinaryNodes(), ...this.buildChildrenNodes()]
  }
}

export class ModelState<T> {
  public readonly root: ModelStatePropNode<T> | null

  constructor(public tree: IModelTree<T, any>) {
    this.root = tree.root ? new ModelStatePropNode(tree.root) : null
  }

  public modelStateNodes(): ModelStateNode<T>[] {
    if (!this.root) {
      return []
    }

    return [this.root, ...this.root.allChildren()]
  }
}
