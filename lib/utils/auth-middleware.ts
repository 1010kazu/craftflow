// lib/utils/auth-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth/jwt';
import { getAuthToken, createErrorResponse } from '@/lib/utils/api';
import { UserRole } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function requireAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
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

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payload;

    return handler(authenticatedRequest);
  };
}

export function requireAdmin(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return requireAuth(async (request) => {
    if (request.user?.role !== UserRole.ADMIN) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', '管理者権限が必要です'),
        { status: 403 }
      );
    }

    return handler(request);
  });
}
