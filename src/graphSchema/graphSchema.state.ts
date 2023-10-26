import { JsonSchemaState, JsonSchemaStateCombinaryNode, JsonSchemaStatePropNode } from "../jsonSchema/jsonSchema.state"
import { IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode, ModelDataNode } from "../types"
import { GraphSchemaNode } from "./graphSchema.types"

export class GraphSchemaStateCombinaryNode<T extends ModelDataNode<any, any, any> = GraphSchemaNode> extends JsonSchemaStateCombinaryNode<T> {
}

export class GraphSchemaStatePropNode<T extends ModelDataNode<any, any, any> = GraphSchemaNode> extends JsonSchemaStatePropNode<T>{
  private _argNodes: IModelStatePropNode<T>[] = []
 
  public sort(sort = 0) {
    if (sort === this._sort) { return }
    this._sort = sort
    this._children = [...this.buildArgNodes(sort), ...this._combinaryNodes, ...this.buildChildrenNodes(sort)]
  }

  public setSelected (value: string | undefined) {
    if (value !== this._selected) {
      this._selected = value
      this._children = [...this._argNodes, ...this.buildCombinaryNodes(), ...this.buildChildrenNodes(this._sort)] 
    }
  }

  private buildArgNodes(sort: number) {
    const { nested } = this.node
    if (!nested[-1]) { return [] }
    // convert nested args to children
    const argList = nested[-1].children() as T[] ?? []
    const sorted = sort ? argList.sort((n1, n2) => (n1.key > n2.key ? -1 * sort : sort)) : argList
    this._argNodes = sorted.length ? sorted.map((arg, i) => this.createStatePropNode(arg, i === 0)) : []
    return this._argNodes
  }

  protected buildChildren(): IModelStateNode<T>[] {
    return [...this.buildArgNodes(this._sort), ...this.buildCombinaryNodes(), ...this.buildChildrenNodes(this._sort)]
  }

  protected createStatePropNode(prop: T, first = false): IModelStatePropNode<T> {
    return new GraphSchemaStatePropNode(prop, first)
  }

  protected createStateCombinaryNode(node: T): IModelStateCombinaryNode<T> {
    return new GraphSchemaStateCombinaryNode(node, this)
  }
}

export class GraphSchemaState<T extends ModelDataNode<any, any, any> = GraphSchemaNode> extends JsonSchemaState<T> {
  protected createStatePropNode(node: T): IModelStatePropNode<T> {
    return new GraphSchemaStatePropNode(node)
  } 
}
