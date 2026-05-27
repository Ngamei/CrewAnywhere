import { NextResponse } from 'next/server';

type ApiMeta = {
  requestId?: string;
};

export type ApiSuccess<T> = {
  data: T;
  meta?: ApiMeta;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
};

export function ok<T>(data: T, init?: ResponseInit, meta?: ApiMeta) {
  return NextResponse.json<ApiSuccess<T>>({ data, meta }, init);
}

export function created<T>(data: T, meta?: ApiMeta) {
  return ok(data, { status: 201 }, meta);
}

export function fail(code: string, message: string, status = 400, details?: unknown, meta?: ApiMeta) {
  return NextResponse.json<ApiError>(
    {
      error: {
        code,
        message,
        details,
      },
      meta,
    },
    { status },
  );
}
