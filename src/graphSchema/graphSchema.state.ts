import { JsonSchemaState, JsonSchemaStateCombinaryNode, JsonSchemaStatePropNode } from "../jsonSchema/jsonSchema.state"
import { IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode, ModelDataNode } from "../types"
import { GraphSchemaNodeData } from "./graphSchema.types"

export class GraphSchemaStateCombinaryNode<T = GraphSchemaNodeData<any>> extends JsonSchemaStateCombinaryNode<T> {
}

export class GraphSchemaStatePropNode<T = GraphSchemaNodeData<any>> extends JsonSchemaStatePropNode<T>{
  private _argNodes: IModelStatePropNode<T>[] = []
 
  public setSelected (value: string | undefined) {
    if (value !== this._selected) {
      this._selected = value
      this._children = [...this._argNodes, ...this.buildCombinaryNodes(), ...this.buildChildrenNodes()] 
    }
  }

  private buildArgNodes() {
    const { nested } = this.node
    if (!nested[-1]) { return [] }
    // convert nested args to children
    const argList = nested[-1].children() ?? []
    this._argNodes = argList.length ? argList.map((arg, i) => this.createStatePropNode(arg, i === 0)) : []
    return this._argNodes
  }

  protected buildChildren(): IModelStateNode<T>[] {
    return [...this.buildArgNodes(), ...this.buildCombinaryNodes(), ...this.buildChildrenNodes()]
  }

  protected createStatePropNode(prop: ModelDataNode<T, any>, first = false): IModelStatePropNode<T> {
    return new GraphSchemaStatePropNode(prop, first)
  }

  protected createStateCombinaryNode(node: ModelDataNode<T, any>): IModelStateCombinaryNode<T> {
    return new GraphSchemaStateCombinaryNode(node, this)
  }
}

export class GraphSchemaState<T = GraphSchemaNodeData<any>> extends JsonSchemaState<T> {
  protected createStatePropNode(node: ModelDataNode<T, any>): IModelStatePropNode<T> {
    return new GraphSchemaStatePropNode(node)
  } 
}
