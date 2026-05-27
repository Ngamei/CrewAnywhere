import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { PlatformSession } from '@/shared/auth/types';

export type ServiceContext = {
  supabase: SupabaseClient;
  user: User | null;
  session: PlatformSession | null;
  requestId: string;
};

export type AuthenticatedServiceContext = ServiceContext & {
  user: User;
  session: PlatformSession;
};

export function createRequestId() {
  return crypto.randomUUID();
}

export function isAuthenticatedContext(
  context: ServiceContext,
): context is AuthenticatedServiceContext {
  return context.user !== null && context.session !== null;
}
