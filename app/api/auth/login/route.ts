// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { UserRole } from '@/types';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'メールアドレスまたはパスワードが正しくありません'),
        { status: 401 }
      );
    }

    // パスワードを検証
    const isValid = await verifyPassword(validated.password, user.password);

    if (!isValid) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'メールアドレスまたはパスワードが正しくありません'),
        { status: 401 }
      );
    }

    // JWTトークンを生成
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', error.issues),
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
}
