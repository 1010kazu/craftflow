// app/api/games/[gameId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAuth, requireAdmin } from '@/lib/utils/auth-middleware';
import { z } from 'zod';

const gameSchema = z.object({
  name: z.string().min(1, 'ゲーム名は必須です'),
  description: z.string().optional(),
});

// GET /api/games/:gameId - ゲーム詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'ゲームが見つかりません'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(game));
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}

// PUT /api/games/:gameId - ゲーム更新（管理者のみ）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  return requireAdmin(async (req) => {
    try {
      const { gameId } = await params;
      const body = await request.json();
      const validated = gameSchema.parse(body);

      const game = await prisma.game.update({
        where: { id: gameId },
        data: {
          name: validated.name,
          description: validated.description,
        },
      });

      return NextResponse.json(createSuccessResponse(game));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', error.issues),
          { status: 400 }
        );
      }

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'ゲームが見つかりません'),
          { status: 404 }
        );
      }

      console.error('Update game error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/games/:gameId - ゲーム削除（管理者のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  return requireAdmin(async (req) => {
    try {
      const { gameId } = await params;
      await prisma.game.delete({
        where: { id: gameId },
      });

      return NextResponse.json(createSuccessResponse({ success: true }));
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', 'ゲームが見つかりません'),
          { status: 404 }
        );
      }

      console.error('Delete game error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
        { status: 500 }
      );
    }
  })(request);
}
