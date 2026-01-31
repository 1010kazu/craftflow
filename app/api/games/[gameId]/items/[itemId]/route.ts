// app/api/games/[gameId]/items/[itemId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAdmin } from '@/lib/utils/auth-middleware';
import { ItemType } from '@/types';
import { z } from 'zod';

const itemUpdateSchema = z.object({
  name: z.string().min(1, 'アイテム名は必須です'),
  itemType: z.nativeEnum(ItemType),
  recipe: z.object({
    craftTime: z.number().int().min(0, '作成時間は0以上である必要があります'),
    outputCount: z.number().int().min(1, '作成個数は1以上である必要があります'),
    requiredFacilityId: z.string().uuid().nullable().optional(),
    materials: z.array(
      z.object({
        materialItemId: z.string().uuid(),
        quantity: z.number().int().min(1, '素材個数は1以上である必要があります'),
      })
    ).min(1, '少なくとも1つの素材が必要です'),
  }).nullable().optional(),
});

// GET /api/games/:gameId/items/:itemId - アイテム詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; itemId: string }> }
) {
  try {
    const { gameId, itemId } = await params;
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        recipe: {
          include: {
            materials: {
              include: {
                materialItem: true,
              },
            },
            requiredFacility: true,
          },
        },
      },
    });

    if (!item || item.gameId !== gameId) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'アイテムが見つかりません'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(item));
  } catch (error) {
    console.error('Get item error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}

// PUT /api/games/:gameId/items/:itemId - アイテム更新（管理者のみ）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; itemId: string }> }
) {
  return requireAdmin(async (req) => {
    try {
      const { gameId, itemId } = await params;
      const body = await request.json();
      const validated = itemUpdateSchema.parse(body);

      // アイテムの存在確認
      const existingItem = await prisma.item.findUnique({
        where: { id: itemId },
        include: { recipe: true },
      });

      if (!existingItem || existingItem.gameId !== gameId) {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'アイテムが見つかりません'),
          { status: 404 }
        );
      }

      // 施設のバリデーション
      if (validated.recipe?.requiredFacilityId) {
        const facility = await prisma.item.findUnique({
          where: { id: validated.recipe.requiredFacilityId },
        });

        if (!facility || facility.itemType !== ItemType.FACILITY) {
          return NextResponse.json(
            createErrorResponse('VALIDATION_ERROR', '施設はFACILITYタイプのアイテムである必要があります'),
            { status: 400 }
          );
        }
      }

      // トランザクションでアイテムとレシピを更新
      const item = await prisma.$transaction(async (tx) => {
        // アイテムの基本情報を更新
        await tx.item.update({
          where: { id: itemId },
          data: {
            name: validated.name,
            itemType: validated.itemType,
          },
        });

        // レシピの更新処理
        if (validated.recipe) {
          // 既存レシピがあれば更新、なければ作成
          if (existingItem.recipe) {
            // 既存の素材を削除
            await tx.recipeMaterial.deleteMany({
              where: { recipeId: existingItem.recipe.id },
            });

            // レシピを更新
            await tx.recipe.update({
              where: { id: existingItem.recipe.id },
              data: {
                craftTime: validated.recipe.craftTime,
                outputCount: validated.recipe.outputCount,
                requiredFacilityId: validated.recipe.requiredFacilityId || null,
                materials: {
                  create: validated.recipe.materials,
                },
              },
            });
          } else {
            // 新規レシピ作成
            await tx.recipe.create({
              data: {
                itemId: itemId,
                craftTime: validated.recipe.craftTime,
                outputCount: validated.recipe.outputCount,
                requiredFacilityId: validated.recipe.requiredFacilityId || null,
                materials: {
                  create: validated.recipe.materials,
                },
              },
            });
          }
        } else if (validated.recipe === null && existingItem.recipe) {
          // recipe が明示的に null の場合、既存レシピを削除
          await tx.recipe.delete({
            where: { id: existingItem.recipe.id },
          });
        }

        // 更新後のアイテムを取得
        return tx.item.findUnique({
          where: { id: itemId },
          include: {
            recipe: {
              include: {
                materials: {
                  include: {
                    materialItem: true,
                  },
                },
                requiredFacility: true,
              },
            },
          },
        });
      });

      return NextResponse.json(createSuccessResponse(item));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', error.issues),
          { status: 400 }
        );
      }

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'アイテムが見つかりません'),
          { status: 404 }
        );
      }

      console.error('Update item error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/games/:gameId/items/:itemId - アイテム削除（管理者のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; itemId: string }> }
) {
  return requireAdmin(async (req) => {
    try {
      const { itemId } = await params;
      await prisma.item.delete({
        where: { id: itemId },
      });

      return NextResponse.json(createSuccessResponse({ success: true }));
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'アイテムが見つかりません'),
          { status: 404 }
        );
      }

      console.error('Delete item error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
        { status: 500 }
      );
    }
  })(request);
}
