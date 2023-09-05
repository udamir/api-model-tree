import * as treeify from 'treeify';

import { IJsonNodeData, IModelRefNode, IModelTreeNode, JsonSchemaTree, ModelDataNode, SchemaFragment } from '../../src';

export function printTree(schema: SchemaFragment) {
  const tree = new JsonSchemaTree()

  tree.load(schema)

  if (!tree.root) { return "" }

  const root: unknown =
    tree.root.children().length > 1
      ? tree.root.children().map(child => prepareTree(child))
      : tree.root.children().length === 1
      ? prepareTree(tree.root.children()[0])
      : {};

  return treeify.asTree(root as treeify.TreeObject, true, true);
}

function printNode(node: IModelTreeNode<IJsonNodeData>): any {
  return {
    ...(node.value()?.types !== null ? { types: node.value()?.types } : null),
    ...(node.value()?.primaryType !== null ? { primaryType: node.value()?.primaryType } : null),
    // ...(node.value.combiners !== null ? { combiners: node.combiners } : null),
    ...(node.value()?.enum !== null ? { enum: node.value()?.enum } : null),
    ...(node.children().length ? { children: node.children().map(prepareTree) } : null)
  };
}

function printRefNode(node: IModelRefNode<IJsonNodeData>): any {
  return {
    $ref: node.ref,
    ...printNode(node as IModelTreeNode<IJsonNodeData>)
  };
}

function printDataNode(node: ModelDataNode<IJsonNodeData>) {
  return "isRef" in node 
    ? printRefNode(node as IModelRefNode<IJsonNodeData>)
    : printNode(node as IModelTreeNode<IJsonNodeData>)
}

function prepareTree(node: ModelDataNode<IJsonNodeData>) {
  return {
    [node.id]: printDataNode(node),
  };
}
