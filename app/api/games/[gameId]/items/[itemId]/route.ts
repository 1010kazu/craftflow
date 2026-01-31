// app/api/games/[gameId]/items/[itemId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAdmin } from '@/lib/utils/auth-middleware';
import { ItemType } from '@/types';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, 'アイテム名は必須です'),
  itemType: z.nativeEnum(ItemType),
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
      const { itemId } = await params;
      const body = await request.json();
      const validated = itemSchema.parse(body);

      const item = await prisma.item.update({
        where: { id: itemId },
        data: {
          name: validated.name,
          itemType: validated.itemType,
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
