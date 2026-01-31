// app/api/games/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAuth, requireAdmin } from '@/lib/utils/auth-middleware';
import { z } from 'zod';

const gameSchema = z.object({
  name: z.string().min(1, 'ゲーム名は必須です'),
  description: z.string().optional(),
});

// GET /api/games - ゲーム一覧取得（認証不要）
export async function GET(request: NextRequest) {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(createSuccessResponse(games));
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}

// POST /api/games - ゲーム追加（管理者のみ）
export const POST = requireAdmin(async (request) => {
  try {
    const body = await request.json();
    const validated = gameSchema.parse(body);

    // 既存ゲームのチェック
    const existingGame = await prisma.game.findUnique({
      where: { name: validated.name },
    });

    if (existingGame) {
      return NextResponse.json(
        createErrorResponse('DUPLICATE_ERROR', 'このゲーム名は既に登録されています'),
        { status: 400 }
      );
    }

    const game = await prisma.game.create({
      data: {
        name: validated.name,
        description: validated.description,
      },
    });

    return NextResponse.json(createSuccessResponse(game), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', error.issues),
        { status: 400 }
      );
    }

    console.error('Create game error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
});
