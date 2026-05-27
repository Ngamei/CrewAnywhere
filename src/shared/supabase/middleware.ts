import type { NextRequest } from 'next/server';
import { handleSession } from '@/middleware/session';

/**
 * @deprecated Prefer `handleSession` from `@/middleware/session`.
 * Retained for backward compatibility with existing imports.
 */
export async function updateSession(request: NextRequest) {
  const { response } = await handleSession(request);
  return response;
}
