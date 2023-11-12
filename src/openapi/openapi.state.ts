
import type { OpenApiModelTree, OpenApiOperationsFilter, OpenApiTreeNode } from "./openapi.types"
import type { IModelStateCombinaryNode, IModelStateNode, IModelStatePropNode } from "../types"
import { JsonSchemaStateCombinaryNode, JsonSchemaStatePropNode } from "../jsonSchema"
import { openApiNodeKind } from "./openapi.consts"
import { modelStateNodeType } from "../consts"

export class OpenApiStateCombinaryNode extends JsonSchemaStateCombinaryNode<OpenApiTreeNode> {
}

export class OpenApiStatePropNode extends JsonSchemaStatePropNode<OpenApiTreeNode> {

  constructor (node: OpenApiTreeNode, first = false, private _filter?: OpenApiOperationsFilter) {
    super(node, first)
    if (node.kind === openApiNodeKind.operation || node.kind === openApiNodeKind.service) {
      (this as any).type = modelStateNodeType.basic
      this.expanded = first
    }
  }

  protected buildChildrenNodes(): IModelStateNode<OpenApiTreeNode>[] {
    // TODO operation parameters
    const children = this.node.kind === openApiNodeKind.service
      ? this.node.children(this.selected).filter((child) => !this._filter || this._filter(child as OpenApiTreeNode))
      : this.node.children(this.selected)

    return children.map((prop, i) => this.createStatePropNode(prop, i === 0))
  }

  protected createStatePropNode(prop: OpenApiTreeNode, first = false): IModelStatePropNode<OpenApiTreeNode> {
    return new OpenApiStatePropNode(prop, first, this._filter)
  }

  protected createStateCombinaryNode(node: OpenApiTreeNode): IModelStateCombinaryNode<OpenApiTreeNode> {
    return new OpenApiStateCombinaryNode(node, this)
  }
}

export class OpenApiState {
  public readonly root: IModelStatePropNode<OpenApiTreeNode> | null

  constructor(tree: OpenApiModelTree, operationId?: string, expandDepth = 1) {
    const filter: OpenApiOperationsFilter = (node) => node.kind !== openApiNodeKind.operation || node.id === operationId 

    this.root = tree.root ? new OpenApiStatePropNode(tree.root as OpenApiTreeNode, true, operationId ? filter : undefined ) : null
    this.root?.expand(expandDepth)
  }
}
