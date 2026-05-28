/**
 * Route protection configuration for CrewAnywhere2.0 auth middleware.
 * Kept separate from Next.js proxy entry so matchers and policies are testable.
 */

/** Paths that never require authentication. */
export const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/api/v1/health',
  '/api/v1/auth/session',
] as const;

/** Path prefixes that require a valid Supabase session (pages redirect, APIs return 401). */
export const PROTECTED_PATH_PREFIXES = ['/api/v1'] as const;

/** Page routes that redirect unauthenticated users to login. */
export const PROTECTED_PAGE_PREFIXES = ['/dashboard'] as const;

/** First-time onboarding routes (require Supabase session). */
export const ONBOARDING_PATH_PREFIX = '/onboarding';

export const AUTH_ENTRY_PATHS = ['/login', '/signup'] as const;

export const AUTH_LOGIN_PATH = '/login';
export const AUTH_SIGNUP_PATH = '/signup';
export const ONBOARDING_START_PATH = '/onboarding';
export const DASHBOARD_HOME_PATH = '/dashboard';

export const ONBOARDING_COMPLETE_COOKIE = 'ca_onboarding_complete';

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

export function isOnboardingPath(pathname: string) {
  return pathname === ONBOARDING_PATH_PREFIX || pathname.startsWith(`${ONBOARDING_PATH_PREFIX}/`);
}

export function isAuthEntryPath(pathname: string) {
  return AUTH_ENTRY_PATHS.includes(pathname as (typeof AUTH_ENTRY_PATHS)[number]);
}

export function hasCompletedOnboardingCookie(request: { cookies: { get: (name: string) => { value: string } | undefined } }) {
  return request.cookies.get(ONBOARDING_COMPLETE_COOKIE)?.value === 'true';
}

export function resolvePostAuthPath(
  request: { cookies: { get: (name: string) => { value: string } | undefined } },
): string {
  if (hasCompletedOnboardingCookie(request)) {
    return DASHBOARD_HOME_PATH;
  }

  return ONBOARDING_START_PATH;
}
