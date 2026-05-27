import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Auth provider abstraction — isolates Supabase Auth behind a stable interface
 * so session resolution and token validation stay provider-agnostic at call sites.
 */
export type AuthProviderSession = {
  user: User | null;
  session: Session | null;
};

export interface AuthProvider {
  getUser(client: SupabaseClient): Promise<User | null>;
  getSession(client: SupabaseClient): Promise<AuthProviderSession>;
  signOut(client: SupabaseClient): Promise<void>;
}

/**
 * Supabase implementation. Always prefer `getUser()` for server-side validation;
 * JWT claims in `getSession()` alone are not replay-safe for authorization decisions.
 */
export class SupabaseAuthProvider implements AuthProvider {
  async getUser(client: SupabaseClient): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  }

  async getSession(client: SupabaseClient): Promise<AuthProviderSession> {
    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (error) {
      return { user: null, session: null };
    }

    return {
      user: session?.user ?? null,
      session: session ?? null,
    };
  }

  async signOut(client: SupabaseClient): Promise<void> {
    await client.auth.signOut();
  }
}

export const defaultAuthProvider = new SupabaseAuthProvider();
