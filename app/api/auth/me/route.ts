// app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse, getAuthToken } from '@/lib/utils/api';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', '認証が必要です'),
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', '無効なトークンです'),
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'ユーザーが見つかりません'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(user));
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}
