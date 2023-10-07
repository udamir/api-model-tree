import * as treeify from 'treeify'

import { IModelRefNode, IModelTreeNode, ModelDataNode, ModelTree } from '../../src'

export function printTree({ root }: ModelTree<any, any>): string {
  if (!root) { return "" }

  const _root = root.children().length > 1
      ? root.children().map(child => prepareTree(child))
      : root.children().length === 1
        ? prepareTree(root.children()[0])
        : {};

  return treeify.asTree(_root as treeify.TreeObject, true, true);
}

function printNode(node: IModelTreeNode<any, any>): any {
  const { _fragment, ...rest } = node.value() ?? {}
  return {
    ...rest,
    ...(node.children().length ? { children: node.children().map(prepareTree) } : {})
  }
}

function printRefNode(node: IModelRefNode<any, any>): any {
  return {
    $ref: node.ref + node.isCycle ? " (cycle)" : "",
    ...printNode(node as IModelTreeNode<any, any>)
  }
}

function printDataNode(node: ModelDataNode<any, any>) {
  return "ref" in node 
    ? printRefNode(node as IModelRefNode<any, any>)
    : printNode(node as IModelTreeNode<any, any>)
}

function prepareTree(node: ModelDataNode<any, any>) {
  return {
    [node.id]: printDataNode(node),
  }
}
