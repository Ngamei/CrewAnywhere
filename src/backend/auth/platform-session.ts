import type { SupabaseClient, User } from '@supabase/supabase-js';
import { IdentityRepository } from '@/backend/auth/identity-repository';
import { canAuthenticate } from '@/shared/auth/permissions';
import { defaultAuthProvider } from '@/shared/auth/provider';
import { resolveAppRole } from '@/shared/auth/roles';
import type { PlatformIdentity, PlatformSession } from '@/shared/auth/types';
import { assertMatchingAuthUserId } from '@/shared/auth/token';

export async function resolvePlatformIdentity(
  supabase: SupabaseClient,
  supabaseUser: User,
): Promise<PlatformIdentity | null> {
  const repository = new IdentityRepository(supabase);
  const authAccount = await repository.findAuthAccountByAuthUserId(supabaseUser.id);

  if (!authAccount) {
    return null;
  }

  if (!assertMatchingAuthUserId(supabaseUser.id, authAccount.auth_user_id)) {
    return null;
  }

  if (!canAuthenticate(authAccount.status)) {
    return null;
  }

  const [businessUser, crewUser] = await Promise.all([
    authAccount.account_type === 'business'
      ? repository.findBusinessUserByAuthAccountId(authAccount.id)
      : Promise.resolve(null),
    authAccount.account_type === 'crew'
      ? repository.findCrewUserByAuthAccountId(authAccount.id)
      : Promise.resolve(null),
  ]);

  const role = resolveAppRole({
    accountType: authAccount.account_type,
    businessRole: businessUser?.role ?? null,
  });

  return {
    authAccount,
    businessUser,
    crewUser,
    role,
    accountType: authAccount.account_type,
  };
}

/**
 * Resolves a replay-safe platform session: validates JWT via `getUser()`, then loads
 * `auth_accounts` and domain actor rows for RLS-aligned authorization.
 */
export async function resolvePlatformSession(supabase: SupabaseClient): Promise<PlatformSession | null> {
  const supabaseUser = await defaultAuthProvider.getUser(supabase);

  if (!supabaseUser) {
    return null;
  }

  const identity = await resolvePlatformIdentity(supabase, supabaseUser);

  if (!identity) {
    return null;
  }

  return {
    supabaseUser,
    identity,
  };
}
