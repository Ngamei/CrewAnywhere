import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  AUTH_LOGIN_PATH,
  isAuthEntryPath,
  isProtectedApiPath,
  isProtectedPagePath,
  isPublicPath,
} from '@/middleware/config';
import { env } from '@/shared/config/env';

export type SessionMiddlewareResult = {
  response: NextResponse;
  userId: string | null;
};

/**
 * Refreshes Supabase auth cookies (SSR-safe) and enforces route-level session presence.
 * Authorization (roles, ownership) remains in route handlers and services.
 */
export async function handleSession(request: NextRequest): Promise<SessionMiddlewareResult> {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({ request });

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { response, userId: null };
  }

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;
  const isAuthenticated = Boolean(userId);

  if (isPublicPath(pathname)) {
    return { response, userId };
  }

  if (isAuthEntryPath(pathname) && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = '';
    return { response: NextResponse.redirect(redirectUrl), userId };
  }

  if (!isAuthenticated && isProtectedPagePath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_LOGIN_PATH;
    redirectUrl.searchParams.set('next', pathname);
    return { response: NextResponse.redirect(redirectUrl), userId: null };
  }

  if (!isAuthenticated && isProtectedApiPath(pathname)) {
    return {
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } },
        { status: 401 },
      ),
      userId: null,
    };
  }

  return { response, userId };
}
