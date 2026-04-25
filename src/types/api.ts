// ============================================================
// Standardized API Response Type
// All API routes return this shape.
// ============================================================

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Helpers — use these in route handlers
// ============================================================

import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, status = 200, headers: Record<string, string> = {}): NextResponse {
  const body: ApiSuccess<T> = { success: true, data };
  return NextResponse.json(body, { status, headers });
}

export function errorResponse(
  error: string,
  status = 400,
  code?: string,
  headers: Record<string, string> = {}
): NextResponse {
  const body: ApiError = { success: false, error, ...(code ? { code } : {}) };
  return NextResponse.json(body, { status, headers });
}
