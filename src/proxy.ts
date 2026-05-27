import type { NextRequest } from 'next/server';
import { handleSession } from '@/middleware/session';

export async function proxy(request: NextRequest) {
  const { response } = await handleSession(request);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
