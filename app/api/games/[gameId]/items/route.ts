// app/api/games/[gameId]/items/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAuth, requireAdmin } from '@/lib/utils/auth-middleware';
import { ItemType } from '@/types';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, 'アイテム名は必須です'),
  itemType: z.nativeEnum(ItemType),
  recipe: z.object({
    craftTime: z.number().int().min(0, '作成時間は0以上である必要があります'),
    outputCount: z.number().int().min(1, '作成個数は1以上である必要があります'),
    requiredFacilityId: z.string().uuid().optional(),
    materials: z.array(
      z.object({
        materialItemId: z.string().uuid(),
        quantity: z.number().int().min(1, '素材個数は1以上である必要があります'),
      })
    ).min(1, '少なくとも1つの素材が必要です'),
  }).optional(),
});

// GET /api/games/:gameId/items - アイテム一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'name_asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      gameId,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const orderBy: any = {};
    if (sort === 'name_asc') {
      orderBy.name = 'asc';
    } else if (sort === 'name_desc') {
      orderBy.name = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json(
      createSuccessResponse({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}

// POST /api/games/:gameId/items - アイテム追加（管理者のみ）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  return requireAdmin(async (req) => {
    try {
      const { gameId } = await params;
      const body = await request.json();
      const validated = itemSchema.parse(body);

      // ゲームの存在確認
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'ゲームが見つかりません'),
          { status: 404 }
        );
      }

      // 既存アイテムのチェック
      const existingItem = await prisma.item.findUnique({
        where: {
          gameId_name: {
            gameId,
            name: validated.name,
          },
        },
      });

      if (existingItem) {
        return NextResponse.json(
          createErrorResponse('DUPLICATE_ERROR', 'このアイテム名は既に登録されています'),
          { status: 400 }
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

      // アイテムとレシピを作成
      const item = await prisma.item.create({
        data: {
          gameId,
          name: validated.name,
          itemType: validated.itemType,
          recipe: validated.recipe
            ? {
                create: {
                  craftTime: validated.recipe.craftTime,
                  outputCount: validated.recipe.outputCount,
                  requiredFacilityId: validated.recipe.requiredFacilityId,
                  materials: {
                    create: validated.recipe.materials,
                  },
                },
              }
            : undefined,
        },
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

      return NextResponse.json(createSuccessResponse(item), { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', error.issues),
          { status: 400 }
        );
      }

      console.error('Create item error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
        { status: 500 }
      );
    }
  })(request);
}
