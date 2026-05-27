/**
 * Route protection configuration for CrewAnywhere2.0 auth middleware.
 * Kept separate from Next.js proxy entry so matchers and policies are testable.
 */

/** Paths that never require authentication. */
export const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/v1/health',
  '/api/v1/auth/session',
] as const;

/** Path prefixes that require a valid Supabase session (pages redirect, APIs return 401). */
export const PROTECTED_PATH_PREFIXES = ['/api/v1'] as const;

/** Page routes that redirect unauthenticated users to login. */
export const PROTECTED_PAGE_PREFIXES = ['/dashboard'] as const;

export const AUTH_LOGIN_PATH = '/login';

export function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number])) {
    return true;
  }

  return false;
}

export function isProtectedApiPath(pathname: string) {
  if (isPublicPath(pathname)) {
    return false;
  }

  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isProtectedPagePath(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isAuthEntryPath(pathname: string) {
  return pathname === AUTH_LOGIN_PATH;
}
