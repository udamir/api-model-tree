import { IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode, IModelTree, ModelDataNode, ModelStateNodeType } from "./types"
import { isModelStatePropNode } from "./utils"
import { modelStateNodeType } from "./consts"

export class ModelStateCombinaryNode<T> implements IModelStateCombinaryNode<T> {
  public readonly type = modelStateNodeType.combinary
  protected _selected: string | undefined

  constructor (public readonly node: ModelDataNode<T, any>, private _parent: ModelStatePropNode<T>, selected?: string) {
    this.node.nestedNode(selected)
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
    this._parent.setSelected(id)
  }
}

export class ModelStatePropNode<T> implements IModelStatePropNode<T>{
  private _argNodes: ModelStatePropNode<T>[] = []
  private _combinaryNodes: ModelStateCombinaryNode<T>[] = []

  protected _expanded = false
  protected _selected: string | undefined
  protected _children: IModelStateNode<T>[] | null = null

  public readonly type: Exclude<ModelStateNodeType, 'combinary'>

  get expanded() {
    return this._expanded
  }

  set expanded(value: boolean) {
    if (value !== this._expanded) {
      this._expanded = value
      if (this._children === null) {
        this._children = this.buildChildren()
      }
    }
  }
  
  get children(): IModelStateNode<T>[] {
    return this.expanded && this._children ? this._children : []
  }
  
  get allChildrenCount(): number {
    return this._children?.reduce((res, curr) => res + (isModelStatePropNode(curr) ? curr.allChildrenCount : 0), this._children.length) ?? 0
  }

  get allChildren(): IModelStateNode<T>[] {
    const _childrent = []

    for (let child of this.children) {
      _childrent.push(child, ...isModelStatePropNode(child) ? child.allChildren : [])
    }

    return _childrent
  }

  public expand(value = 1) {
    this.expanded = !!value

    if (value > 1 && !("isCycle" in this.node && this.node.isCycle)) {
      this.children.forEach((child) => isModelStatePropNode(child) && child.expand(value-1))
    } 
  }

  public collapse(value = 1) {
    if (value > 1) {
      this.children.forEach((child) => isModelStatePropNode(child) && child.collapse(value-1))
    } 
    
    this.expanded = !value 
  }
  
  get selected() {
    return this._selected
  }

  setSelected (value: string | undefined) {
    if (value !== this._selected) {
      this._selected = value
      this._children = [...this._argNodes, ...this.buildCombinaryNodes(), ...this.buildChildrenNodes()] 
    }
  }

  get value(): T | null {
    return this.node.value(this.selected)
  }

  constructor (public readonly node: ModelDataNode<T, any>, public readonly first = false) {
    this.type = node.children().length || node.nested.length || node.nested[-1] ? modelStateNodeType.expandable : modelStateNodeType.basic
  }

  private buildArgNodes() {
    const { nested } = this.node
    if (!nested[-1]) { return [] }
    // convert nested args to children
    const argList = nested[-1].children() ?? []
    this._argNodes = argList.length ? argList.map((arg, i) => new ModelStatePropNode(arg, i === 0)) : []
    return this._argNodes
  }

  private buildCombinaryNodes() {
    if (!this.node.nested.length) { return []}
    const _combinary: ModelStateCombinaryNode<T>[] = []
    
    // convert nested to children
    let node = this.node
    for (let i = 0; node.nested.length > 0; i++) {
      const combinary = this._combinaryNodes[i] ?? new ModelStateCombinaryNode(node, this)
      node = node.nestedNode(combinary.selected) ?? node.nested[0]
      _combinary.push(combinary)
    }

    this._combinaryNodes = _combinary
    return _combinary
  }

  private buildChildrenNodes(): IModelStateNode<T>[] {
    const children = this.node.children(this.selected)
    return children.length ? children.map((prop, i) => new ModelStatePropNode(prop, i === 0)) : []
  }

  protected buildChildren(): IModelStateNode<T>[] {
    return [...this.buildArgNodes(), ...this.buildCombinaryNodes(), ...this.buildChildrenNodes()]
  }
}

export class ModelState<T> {
  public readonly root: ModelStatePropNode<T> | null

  constructor(public tree: IModelTree<T, any>, expandDepth = 1) {
    this.root = tree.root ? new ModelStatePropNode(tree.root) : null
    this.root?.expand(expandDepth)
  }

  public modelStateNodes(): IModelStateNode<T>[] {
    if (!this.root) {
      return []
    }

    return [this.root, ...this.root.allChildren]
  }
}
