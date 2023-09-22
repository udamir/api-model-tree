import { IModelTree, ModelDataNode } from "./types"

type ModelStateNode<T> = ModelStateCombinerNode<T> | ModelStatePropNode<T>

class NodelStateBaseNode<T>{
  protected _selected: string | undefined
  protected _children: ModelStateNode<T>[] = []

  public readonly type: string = 'base'

  get children(): ModelStateNode<T>[] {
    return this._children
  }

  get selected() {
    return this._selected
  }

  get childrenTotal(): number {
    return this._children.reduce((res, curr) => res + curr.childrenTotal, this._children.length)
  }

  public allChildren(): ModelStateNode<T>[] {
    const _childrent = []

    for (let child of this._children) {
      _childrent.push(child, ...child.allChildren())
    }

    return _childrent
  }

  constructor(public readonly first = false) {
  }

}

class ModelStateCombinerNode<T> extends NodelStateBaseNode<T> {

  public readonly type: string = 'combinary'

  constructor (public node: ModelDataNode<T, any>, private _parent: NodelStateBaseNode<T>) {
    super()
    this.buildChildren()
  }
  
  protected buildChildren() {
    const _children: ModelStateNode<T>[] = []
    // convert nested to children
    const nested = this.node?.nested ?? []
    nested.length && _children.push(new ModelStateCombinerNode(this.node!, this._parent))
    return _children
  }

  public select(id: string) {
    if (id === this._selected) { return }
    this._selected = id
    this._children = this.buildChildren()
  }
}

class ModelStatePropNode<T> extends NodelStateBaseNode<T>{
  private _expandDepth: number
  private _expanded: boolean

  private _argNodes: ModelStateNode<T>[] = []
  private _combinaryNodes: ModelStateNode<T>[] = []
  private _childrenNodes: ModelStateNode<T>[] = []

  public readonly type: string = 'property'
  
  get expanded() {
    return this._expanded
  }

  set expanded(value: boolean) {
    if (value === this._expanded) { return }
    this._expanded = value
    this._children = [...this._argNodes, ...this._combinaryNodes, ...this.buildChildrenNodes()]
  }

  get value(): T | null {
    return this.node.value(this._selected)
  }

  constructor (public node: ModelDataNode<T, any>, _expandDepth = 1, first = false) {
    super(first)
    this._expanded = _expandDepth > 0
    this._expandDepth = _expandDepth < 0 ? 0 : _expandDepth
    this._children = this.buildChildren()
  }

  private buildArgNodes() {
    const { nested } = this.node
    if (nested[nested.length-1].kind !== "args") { return [] }
    // convert nested args to children
    const argList = nested[nested.length-1].children() ?? []
    this._argNodes = argList.length ? argList.map((arg, i) => new ModelStatePropNode(arg, this._expandDepth - 1, i === 0)) : []
    return this._argNodes
  }

  private buildCombinaryNodes() {
    const { nested } = this.node
    const combiner = nested[nested.length-1].kind === "args" ? nested.slice(0, -1) : nested
    // convert nested to children
    this._combinaryNodes = combiner.length ? [new ModelStateCombinerNode(this.node, this)] : []
    return this._combinaryNodes
  }

  private buildChildrenNodes(): ModelStateNode<T>[] {
    if (!this.expanded) { return [] }
    const children = this.node.children(this.selected)
    this._childrenNodes = children.length ? children.map((prop) => new ModelStatePropNode(prop)) : []
    return this._childrenNodes
  }

  protected buildChildren(): ModelStateNode<T>[] {
    return [...this.buildArgNodes(), ...this.buildCombinaryNodes(), ...this.buildChildrenNodes()]
  }
}

export class ModelState<T> {
  private _root

  constructor(public tree: IModelTree<T, any>) {
    this._root = tree.root ? new ModelStatePropNode(tree.root) : null
  }

  public modelStateNodes() {
    if (!this._root) {
      return []
    }

    return [this._root, ...this._root.allChildren()]
  }
}
