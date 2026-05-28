import type { User } from '@supabase/supabase-js';
import type { AccountType, AccountStatus, BusinessRole } from '@/shared/auth/enums';
import type { UserRole } from '@/shared/auth/roles';

/** Row shape for `public.auth_accounts` (read paths). */
export type AuthAccountRecord = {
  id: string;
  auth_user_id: string | null;
  email: string;
  account_type: AccountType;
  provider: string;
  provider_subject: string | null;
  status: AccountStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.business_users`. */
export type BusinessUserRecord = {
  id: string;
  auth_account_id: string;
  role: BusinessRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.crew_users`. */
export type CrewUserRecord = {
  id: string;
  auth_account_id: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/**
 * Resolved platform identity after Supabase JWT validation.
 * Bridges `auth.users` → `auth_accounts` → domain actor rows.
 */
export type PlatformIdentity = {
  authAccount: AuthAccountRecord;
  businessUser: BusinessUserRecord | null;
  crewUser: CrewUserRecord | null;
  role: UserRole;
  accountType: AccountType;
};

/** Full SSR-safe session: Supabase user + platform identity. */
export type PlatformSession = {
  supabaseUser: User;
  identity: PlatformIdentity;
};

/** Serializable session payload for API responses (no sensitive tokens). */
export type PlatformSessionPayload = {
  authenticated: true;
  user: {
    id: string;
    email: string | undefined;
  };
  identity: {
    authAccountId: string;
    accountType: AccountType;
    accountStatus: AccountStatus;
    role: UserRole;
    businessUserId: string | null;
    crewUserId: string | null;
  };
};

export function toPlatformSessionPayload(session: PlatformSession): PlatformSessionPayload {
  const { supabaseUser, identity } = session;

  return {
    authenticated: true,
    user: {
      id: supabaseUser.id,
      email: supabaseUser.email,
    },
    identity: {
      authAccountId: identity.authAccount.id,
      accountType: identity.accountType,
      accountStatus: identity.authAccount.status,
      role: identity.role,
      businessUserId: identity.businessUser?.id ?? null,
      crewUserId: identity.crewUser?.id ?? null,
    },
  };
}

/** Supabase-authenticated user without a linked `auth_accounts` row yet. */
export type IdentityPendingSessionPayload = {
  authenticated: true;
  phase: 'identity_pending';
  user: {
    id: string;
    email: string | undefined;
  };
};

export type AuthSessionResponse =
  | { authenticated: false }
  | PlatformSessionPayload
  | IdentityPendingSessionPayload;

export function isPlatformSessionPayload(
  session: AuthSessionResponse,
): session is PlatformSessionPayload {
  return session.authenticated === true && 'identity' in session;
}

export function isIdentityPendingSession(
  session: AuthSessionResponse,
): session is IdentityPendingSessionPayload {
  return session.authenticated === true && 'phase' in session && session.phase === 'identity_pending';
}

export function isSupabaseAuthenticated(session: AuthSessionResponse) {
  return session.authenticated === true;
}
