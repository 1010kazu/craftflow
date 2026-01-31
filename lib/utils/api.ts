// lib/utils/api.ts

import { NextRequest } from 'next/server';
import { ApiResponse } from '@/types';

export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse<never> {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

export function getAuthToken(request: Request | NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
