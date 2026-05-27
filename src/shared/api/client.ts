import type { ApiError, ApiSuccess } from '@/shared/api/responses';

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const body = (await response.json()) as ApiSuccess<T> | ApiError;

  if (!response.ok || 'error' in body) {
    const error = 'error' in body ? body.error : { code: 'UNKNOWN', message: response.statusText };
    throw new ApiClientError(error.code, error.message, response.status, error.details);
  }

  return body.data;
}
