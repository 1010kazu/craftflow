// lib/utils/recipe-tree.ts

import { RecipeTreeNode, Item, RecipeWithMaterials, ItemType } from '@/types';
import { prisma } from '@/lib/db/prisma';

export async function buildRecipeTree(
  itemId: string,
  requiredQuantity: number = 1,
  depth: number = 0,
  maxDepth: number = 10,
  visited: Set<string> = new Set()
): Promise<RecipeTreeNode> {
  // 無限ループ防止
  if (visited.has(itemId) || depth > maxDepth) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }
    return createLeafNode(item, requiredQuantity);
  }

  visited.add(itemId);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  const recipe = await prisma.recipe.findUnique({
    where: { itemId },
    include: {
      materials: {
        include: {
          materialItem: true,
        },
      },
      requiredFacility: true,
    },
  });

  const node: RecipeTreeNode = {
    item: {
      ...item,
      itemType: item.itemType as ItemType,
    },
    recipe: recipe as RecipeWithMaterials | undefined,
    children: [],
    isExpanded: true,
    isVisible: true,
    requiredQuantity,
    totalRequiredQuantity: requiredQuantity,
  };

  // レシピがない場合は葉ノード
  if (!recipe) {
    visited.delete(itemId);
    return node;
  }

  // 各素材について再帰的にツリーを構築
  for (const material of recipe.materials) {
    const childQuantity = calculateChildQuantity(
      requiredQuantity,
      material.quantity,
      recipe.outputCount
    );

    const childNode = await buildRecipeTree(
      material.materialItemId,
      childQuantity,
      depth + 1,
      maxDepth,
      visited
    );

    node.children.push(childNode);
  }

  visited.delete(itemId);
  return node;
}

function createLeafNode(item: any, requiredQuantity: number): RecipeTreeNode {
  return {
    item: {
      ...item,
      itemType: item.itemType as ItemType,
    },
    recipe: undefined,
    children: [],
    isExpanded: false,
    isVisible: true,
    requiredQuantity,
    totalRequiredQuantity: requiredQuantity,
  };
}

function calculateChildQuantity(
  parentQuantity: number,
  materialQuantity: number,
  outputCount: number
): number {
  return Math.ceil((parentQuantity * materialQuantity) / outputCount);
}

export function calculateMaterialSummary(
  tree: RecipeTreeNode
): Map<string, { itemName: string; totalQuantity: number }> {
  const summary = new Map<string, { itemName: string; totalQuantity: number }>();

  function traverse(node: RecipeTreeNode) {
    // このノード自体が素材として必要
    if (node.requiredQuantity > 0) {
      const current = summary.get(node.item.id);
      if (current) {
        summary.set(node.item.id, {
          itemName: node.item.name,
          totalQuantity: current.totalQuantity + node.requiredQuantity,
        });
      } else {
        summary.set(node.item.id, {
          itemName: node.item.name,
          totalQuantity: node.requiredQuantity,
        });
      }
    }

    // 子ノードを再帰的に処理
    for (const child of node.children) {
      if (child.isVisible) {
        traverse(child);
      }
    }
  }

  traverse(tree);
  return summary;
}
