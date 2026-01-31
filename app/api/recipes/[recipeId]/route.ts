// app/api/recipes/[recipeId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAdmin } from '@/lib/utils/auth-middleware';
import { ItemType } from '@/types';
import { z } from 'zod';

const recipeSchema = z.object({
  craftTime: z.number().int().min(0, '作成時間は0以上である必要があります'),
  outputCount: z.number().int().min(1, '作成個数は1以上である必要があります'),
  requiredFacilityId: z.string().uuid().optional(),
  materials: z.array(
    z.object({
      materialItemId: z.string().uuid(),
      quantity: z.number().int().min(1, '素材個数は1以上である必要があります'),
    })
  ).min(1, '少なくとも1つの素材が必要です'),
});

// GET /api/recipes/:recipeId - レシピ詳細取得
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
        materials: {
          include: {
            materialItem: true,
          },
        },
        requiredFacility: true,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'レシピが見つかりません'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(recipe));
  } catch (error) {
    console.error('Get recipe error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}

// PUT /api/recipes/:recipeId - レシピ更新（管理者のみ）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  return requireAdmin(async (req) => {
    try {
      const { recipeId } = await params;
      const body = await request.json();
      const validated = recipeSchema.parse(body);

      // 施設のバリデーション
      if (validated.requiredFacilityId) {
        const facility = await prisma.item.findUnique({
          where: { id: validated.requiredFacilityId },
        });

        if (!facility || facility.itemType !== ItemType.FACILITY) {
          return NextResponse.json(
            createErrorResponse('VALIDATION_ERROR', '施設はFACILITYタイプのアイテムである必要があります'),
            { status: 400 }
          );
        }
      }

      // 既存の素材を削除してから新しい素材を作成
      await prisma.recipeMaterial.deleteMany({
        where: { recipeId },
      });

      const recipe = await prisma.recipe.update({
        where: { id: recipeId },
        data: {
          craftTime: validated.craftTime,
          outputCount: validated.outputCount,
          requiredFacilityId: validated.requiredFacilityId,
          materials: {
            create: validated.materials,
          },
        },
        include: {
          item: true,
          materials: {
            include: {
              materialItem: true,
            },
          },
          requiredFacility: true,
        },
      });

      return NextResponse.json(createSuccessResponse(recipe));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', error.issues),
          { status: 400 }
        );
      }

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'レシピが見つかりません'),
          { status: 404 }
        );
      }

      console.error('Update recipe error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/recipes/:recipeId - レシピ削除（管理者のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  return requireAdmin(async (req) => {
    try {
      const { recipeId } = await params;
      await prisma.recipe.delete({
        where: { id: recipeId },
      });

      return NextResponse.json(createSuccessResponse({ success: true }));
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'レシピが見つかりません'),
          { status: 404 }
        );
      }

      console.error('Delete recipe error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
        { status: 500 }
      );
    }
  })(request);
}
