import type { GraphApiNodeData, GraphApiNodeKind, GraphOperationsFilter, GraphApiTreeNode } from "./graphapi.types"
import type { IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode, IModelTree } from "../types"
import { GraphSchemaStateCombinaryNode, GraphSchemaStatePropNode } from "../graphSchema/graphSchema.state"
import { GraphSchemaNodeMeta } from "../graphSchema"
import { graphApiNodeKind } from "./graphapi.consts"
import { modelStateNodeType } from "../consts"

const isGraphApiOperationNode = (node: GraphApiTreeNode): boolean => {
  return [graphApiNodeKind.query, graphApiNodeKind.mutation, graphApiNodeKind.subscription].includes(node.kind as any)
} 

export class GraphApiStateCombinaryNode extends GraphSchemaStateCombinaryNode<GraphApiTreeNode> {
}

export class GraphApiStatePropNode extends GraphSchemaStatePropNode<GraphApiTreeNode> {

  constructor (node: GraphApiTreeNode, first = false, private _filter?: GraphOperationsFilter) {
    super(node, first)
    if (isGraphApiOperationNode(node) || node.kind === graphApiNodeKind.schema) {
      (this as any).type = modelStateNodeType.basic
      this.expanded = first
    }
  }

  protected buildChildrenNodes(): IModelStateNode<GraphApiTreeNode>[] {
    const children = this.node.kind === graphApiNodeKind.schema
      ? this.node.children(this.selected).filter((child) => !this._filter || this._filter(child as GraphApiTreeNode))
      : this.node.children(this.selected)

    let directives = 0
    return children.length ? children.map((prop, i) => {
      directives += prop.kind === graphApiNodeKind.directive ? 1 : 0
      return this.createStatePropNode(prop as GraphApiTreeNode, i === 0 || directives === 1)
    }) : []
  }

  protected createStatePropNode(prop: GraphApiTreeNode, first = false): IModelStatePropNode<GraphApiTreeNode> {
    return new GraphApiStatePropNode(prop, first, this._filter)
  }

  protected createStateCombinaryNode(node: GraphApiTreeNode): IModelStateCombinaryNode<GraphApiTreeNode> {
    return new GraphApiStateCombinaryNode(node, this)
  }
}

export class GraphApiState {
  public readonly root: IModelStatePropNode<GraphApiTreeNode> | null

  constructor(tree: IModelTree<GraphApiNodeData, GraphApiNodeKind, GraphSchemaNodeMeta>, operationName?: string, expandDepth = 1) {
    const filter: GraphOperationsFilter = (node) => !isGraphApiOperationNode(node) || node.key === operationName

    this.root = tree.root ? new GraphApiStatePropNode(tree.root as GraphApiTreeNode, true, operationName ? filter : undefined ) : null
    this.root?.expand(expandDepth)
  }
}
