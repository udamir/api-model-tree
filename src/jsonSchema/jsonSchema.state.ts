import {
  IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode,
  ModelDataNode, ModelStateNodeType,
} from "../types"
import { JsonSchemaNode, JsonSchemaTreeNode } from "./jsonSchema.types"
import { isModelStatePropNode } from "../utils"
import { modelStateNodeType } from "../consts"
import { ModelTree } from "../modelTree"

export class JsonSchemaStateCombinaryNode<T extends ModelDataNode<any, any, any> = JsonSchemaTreeNode>
  implements IModelStateCombinaryNode<T>
{
  public readonly type = modelStateNodeType.combinary
  protected _selected: string | undefined

  constructor(public readonly node: T, private _parent: IModelStatePropNode<T>, selected?: string) {
    this.node.nestedNode(selected)
  }

  get selected() {
    if (!this._selected && this.node.nested.length) {
      return this.node.nested[0].id
    }
    return this._selected
  }

  public select(id: string) {
    if (id === this.selected) {
      return
    }
    this._selected = id
    this._parent.setSelected(id)
  }
}

export class JsonSchemaStatePropNode<T extends ModelDataNode<any, any, any> = JsonSchemaTreeNode>
  implements IModelStatePropNode<T>
{
  private _combinaryNodes: IModelStateCombinaryNode<T>[] = []
  private _childrenNodes: IModelStatePropNode<T>[] = []

  protected _expanded = false
  protected _selected: string | undefined
  protected _children: IModelStateNode<T>[] | null = null

  public readonly type: Exclude<ModelStateNodeType, "combinary">

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
    return (
      this._children?.reduce(
        (res, curr) => res + (isModelStatePropNode(curr) ? curr.allChildrenCount : 0),
        this._children.length
      ) ?? 0
    )
  }

  get allChildren(): IModelStateNode<T>[] {
    const _childrent = []

    for (let child of this.children) {
      _childrent.push(child, ...(isModelStatePropNode(child) ? child.allChildren : []))
    }

    return _childrent
  }

  public expand(value = 1) {
    this.expanded = !!value

    if (value > 1 && !("isCycle" in this.node && this.node.isCycle)) {
      this.children.forEach((child) => isModelStatePropNode(child) && child.expand(value - 1))
    }
  }

  public collapse(value = 1) {
    if (value > 1) {
      this.children.forEach((child) => isModelStatePropNode(child) && child.collapse(value - 1))
    }

    this.expanded = !value
  }

  get selected() {
    return this._selected
  }

  public setSelected(value: string | undefined) {
    if (value !== this._selected) {
      this._selected = value
      this._children = [...this.buildCombinaryNodes(), ...this.buildChildrenNodes()]
    }
  }

  get value() {
    return this.node.value(this.selected)
  }

  get meta() {
    return this.node.meta
  }

  get nestedNode(): T | null {
    return this.node.nestedNode(this.selected) as T
  }

  public sort(dir = 0) {
    if (!dir) {
      this._children = [...this._combinaryNodes, ...this._childrenNodes]
    } else {
      const sorted = this._childrenNodes.sort((n1, n2) => (n1.node.key > n2.node.key ? -1 * dir : dir))
      this._children = [...this._combinaryNodes, ...sorted]
    }
  }

  constructor(public readonly node: T, public readonly first = false) {
    this.type =
      node.children().length || node.nested.length || node.nested[-1]
        ? modelStateNodeType.expandable
        : modelStateNodeType.basic
  }

  protected buildCombinaryNodes() {
    if (!this.node.nested.length) {
      return []
    }
    const _combinary: IModelStateCombinaryNode<T>[] = []

    // convert nested to children
    let node = this.node
    for (let i = 0; node.nested.length > 0; i++) {
      const combinary = this._combinaryNodes[i] ?? this.createStateCombinaryNode(node)
      node = (node.nestedNode(combinary.selected) as T) ?? node.nested[0]
      _combinary.push(combinary)
    }

    this._combinaryNodes = _combinary
    return _combinary
  }

  protected buildChildrenNodes(): IModelStateNode<T>[] {
    const children = this.node.children(this.selected) as T[]
    this._childrenNodes = children.length ? children.map((prop, i) => this.createStatePropNode(prop, i === 0)) : []
    return this._childrenNodes
  }

  protected buildChildren(): IModelStateNode<T>[] {
    return [...this.buildCombinaryNodes(), ...this.buildChildrenNodes()]
  }

  protected createStatePropNode(prop: T, first = false): IModelStatePropNode<T> {
    return new JsonSchemaStatePropNode(prop, first)
  }

  protected createStateCombinaryNode(node: T): IModelStateCombinaryNode<T> {
    return new JsonSchemaStateCombinaryNode(node, this)
  }
}

export class JsonSchemaState<T extends ModelDataNode<any, any, any> = JsonSchemaNode> {
  public readonly root: IModelStatePropNode<T> | null

  protected createStatePropNode(node: T): IModelStatePropNode<T> {
    return new JsonSchemaStatePropNode(node)
  }

  constructor(public tree: ModelTree<ReturnType<T["value"]>, T["kind"], T["meta"]>, expandDepth = 1) {
    this.root = tree.root ? this.createStatePropNode(tree.root as T) : null
    this.root?.expand(expandDepth)
  }

  public modelStateNodes(): IModelStateNode<T>[] {
    if (!this.root) {
      return []
    }

    return [this.root, ...this.root.allChildren]
  }
}
