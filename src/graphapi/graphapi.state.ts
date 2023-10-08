import { GraphApiNodeData, GraphApiNodeKind, GraphOperationsFilter, GraphapiTreeNode } from "./graphapi.types"
import { GraphSchemaStateCombinaryNode, GraphSchemaStatePropNode } from "../graphSchema/graphSchema.state"
import { IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode, IModelTree } from "../types"
import { GraphSchemaNodeMeta } from "../graphSchema"
import { graphApiNodeKind } from "./graphapi.consts"
import { modelStateNodeType } from "../consts"

const isGraphApiOperationNode = (node: GraphapiTreeNode): boolean => {
  return [graphApiNodeKind.query, graphApiNodeKind.mutation, graphApiNodeKind.subscription].includes(node.kind as any)
} 

export class GraphApiStateCombinaryNode extends GraphSchemaStateCombinaryNode<GraphapiTreeNode> {
}

export class GraphApiStatePropNode extends GraphSchemaStatePropNode<GraphapiTreeNode> {

  constructor (node: GraphapiTreeNode, first = false, private _filter?: GraphOperationsFilter) {
    super(node, first)
    if (isGraphApiOperationNode(node) || node.kind === graphApiNodeKind.schema) {
      (this as any).type = modelStateNodeType.basic
      this.expanded = first
    }
  }

  protected buildChildrenNodes(): IModelStateNode<GraphapiTreeNode>[] {
    const children = this.node.kind === graphApiNodeKind.schema
      ? this.node.children(this.selected).filter((child) => !this._filter || this._filter(child as GraphapiTreeNode))
      : this.node.children(this.selected)

    let directives = 0
    return children.length ? children.map((prop, i) => {
      directives += prop.kind === graphApiNodeKind.directive ? 1 : 0
      return this.createStatePropNode(prop as GraphapiTreeNode, i === 0 || directives === 1)
    }) : []
  }

  protected createStatePropNode(prop: GraphapiTreeNode, first = false): IModelStatePropNode<GraphapiTreeNode> {
    return new GraphApiStatePropNode(prop, first, this._filter)
  }

  protected createStateCombinaryNode(node: GraphapiTreeNode): IModelStateCombinaryNode<GraphapiTreeNode> {
    return new GraphApiStateCombinaryNode(node, this)
  }
}

export class GraphApiState {
  public readonly root: IModelStatePropNode<GraphapiTreeNode> | null

  constructor(tree: IModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>, operationName?: string, expandDepth = 1) {
    const filter: GraphOperationsFilter = (node) => !isGraphApiOperationNode(node) || node.key === operationName

    this.root = tree.root ? new GraphApiStatePropNode(tree.root as GraphapiTreeNode, true, operationName ? filter : undefined ) : null
    this.root?.expand(expandDepth)
  }
}
