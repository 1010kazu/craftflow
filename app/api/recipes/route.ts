// app/api/recipes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAdmin } from '@/lib/utils/auth-middleware';
import { ItemType } from '@/types';
import { z } from 'zod';

const recipeSchema = z.object({
  itemId: z.string().uuid(),
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

// POST /api/recipes - レシピ追加（管理者のみ）
export const POST = requireAdmin(async (request) => {
  try {
    const body = await request.json();
    const validated = recipeSchema.parse(body);

    // アイテムの存在確認
    const item = await prisma.item.findUnique({
      where: { id: validated.itemId },
    });

    if (!item) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'アイテムが見つかりません'),
        { status: 404 }
      );
    }

    // 既存レシピのチェック
    const existingRecipe = await prisma.recipe.findUnique({
      where: { itemId: validated.itemId },
    });

    if (existingRecipe) {
      return NextResponse.json(
        createErrorResponse('DUPLICATE_ERROR', 'このアイテムには既にレシピが登録されています'),
        { status: 400 }
      );
    }

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

    // レシピを作成
    const recipe = await prisma.recipe.create({
      data: {
        itemId: validated.itemId,
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

    return NextResponse.json(createSuccessResponse(recipe), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', error.issues),
        { status: 400 }
      );
    }

    console.error('Create recipe error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
});
