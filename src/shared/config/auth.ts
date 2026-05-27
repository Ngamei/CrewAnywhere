/**
 * Cookie and session defaults for Supabase SSR auth.
 * Supabase sets cookie options via @supabase/ssr; these document expected production settings.
 */
export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
};

export const AUTH_SESSION_HEADER = 'x-crewanywhere-request-id';
