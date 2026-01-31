// app/api/recipes/[recipeId]/tree/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { buildRecipeTree, calculateMaterialSummary } from '@/lib/utils/recipe-tree';

// GET /api/recipes/:recipeId/tree - 再帰的レシピツリー取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const { recipeId } = await params;
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        item: true,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'レシピが見つかりません'),
        { status: 404 }
      );
    }

    const tree = await buildRecipeTree(recipe.itemId, 1);
    const summary = calculateMaterialSummary(tree);

    const materialSummary = Array.from(summary.entries()).map(([itemId, data]) => ({
      itemId,
      itemName: data.itemName,
      totalQuantity: data.totalQuantity,
    }));

    return NextResponse.json(
      createSuccessResponse({
        tree,
        materialSummary,
      })
    );
  } catch (error) {
    console.error('Get recipe tree error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}
