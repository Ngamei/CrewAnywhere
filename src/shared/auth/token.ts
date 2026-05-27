import type { SupabaseClient, User } from '@supabase/supabase-js';
import { defaultAuthProvider } from '@/shared/auth/provider';

export type TokenValidationResult =
  | { valid: true; user: User }
  | { valid: false; reason: 'missing' | 'invalid' | 'expired' };

/**
 * Server-side token validation via Supabase Auth (validates JWT with auth server).
 * Use this instead of trusting session cookies or `getSession()` claims alone.
 */
export async function validateAccessToken(
  client: SupabaseClient,
  provider = defaultAuthProvider,
): Promise<TokenValidationResult> {
  const user = await provider.getUser(client);

  if (!user) {
    return { valid: false, reason: 'missing' };
  }

  return { valid: true, user };
}

/** Returns true when the Supabase user id matches the expected auth.users id. */
export function assertMatchingAuthUserId(supabaseUserId: string, expectedAuthUserId: string | null) {
  if (!expectedAuthUserId || supabaseUserId !== expectedAuthUserId) {
    return false;
  }

  return true;
}
