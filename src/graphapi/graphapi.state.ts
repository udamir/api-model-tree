import { IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode, IModelTree, ModelDataNode } from "../types"
import { GraphSchemaStateCombinaryNode, GraphSchemaStatePropNode } from "../graphSchema/graphSchema.state"
import { GraphApiNodeData, GraphOperationsFilter } from "./graphapi.types"
import { graphApiNodeKind } from "./graphapi.consts"
import { modelStateNodeType } from "../consts"

const isGraphApiOperationNode = (node: ModelDataNode<any, any>): boolean => {
  return [graphApiNodeKind.query, graphApiNodeKind.mutation, graphApiNodeKind.subscription].includes(node.kind)
} 

export class GraphApiStateCombinaryNode<T = GraphApiNodeData> extends GraphSchemaStateCombinaryNode<T> {
}

export class GraphApiStatePropNode<T = GraphApiNodeData> extends GraphSchemaStatePropNode<T>{

  constructor (node: ModelDataNode<T, any>, first = false, private _filter?: GraphOperationsFilter<T>) {
    super(node, first)
    if (isGraphApiOperationNode(node) || node.kind === graphApiNodeKind.schema) {
      (this as any).type = modelStateNodeType.basic
      this.expanded = first
    }
  }

  protected buildChildrenNodes(): IModelStateNode<T>[] {
    const children = this.node.kind === graphApiNodeKind.schema
      ? this.node.children(this.selected).filter((child) => !this._filter || this._filter(child))
      : this.node.children(this.selected)

    let directives = 0
    return children.length ? children.map((prop, i) => {
      directives += prop.kind === graphApiNodeKind.directive ? 1 : 0
      return this.createStatePropNode(prop, i === 0 || directives === 1)
    }) : []
  }

  protected createStatePropNode(prop: ModelDataNode<T, any>, first = false): IModelStatePropNode<T> {
    return new GraphApiStatePropNode(prop, first, this._filter)
  }

  protected createStateCombinaryNode(node: ModelDataNode<T, any>): IModelStateCombinaryNode<T> {
    return new GraphApiStateCombinaryNode(node, this)
  }
}

export class GraphApiState<T = GraphApiNodeData> {
  public readonly root: IModelStatePropNode<T> | null

  constructor(tree: IModelTree<T, any>, operationName?: string, expandDepth = 1) {
    const filter: GraphOperationsFilter<T> = (node) => !isGraphApiOperationNode(node) || node.key === operationName

    this.root = tree.root ? new GraphApiStatePropNode(tree.root, true, operationName ? filter : undefined ) : null
    this.root?.expand(expandDepth)
  }
}
