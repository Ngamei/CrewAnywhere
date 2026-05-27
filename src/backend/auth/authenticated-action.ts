import type { SupabaseClient } from '@supabase/supabase-js';
import { UnauthorizedError } from '@/shared/api/errors';
import { resolvePlatformSession } from '@/backend/auth/platform-session';
import {
  createRequestId,
  type AuthenticatedServiceContext,
  type ServiceContext,
} from '@/backend/services/service-context';
import { assertAuthenticated } from '@/shared/auth/guards';

export type AuthenticatedActionOptions = {
  supabase: SupabaseClient;
  requestId?: string;
};

/**
 * Runs a handler with a validated platform session and service context.
 * JWT is validated via `getUser()` before identity resolution (replay-safe).
 */
export async function runAuthenticatedAction<T>(
  options: AuthenticatedActionOptions,
  handler: (context: AuthenticatedServiceContext) => Promise<T>,
): Promise<T> {
  const requestId = options.requestId ?? createRequestId();
  const session = await resolvePlatformSession(options.supabase);

  assertAuthenticated(session);

  const context: AuthenticatedServiceContext = {
    supabase: options.supabase,
    user: session.supabaseUser,
    session,
    requestId,
  };

  return handler(context);
}

export async function runOptionalAuthAction<T>(
  options: AuthenticatedActionOptions,
  handler: (context: ServiceContext) => Promise<T>,
): Promise<T> {
  const requestId = options.requestId ?? createRequestId();
  const session = await resolvePlatformSession(options.supabase);

  return handler({
    supabase: options.supabase,
    user: session?.supabaseUser ?? null,
    session,
    requestId,
  });
}

export function requireAuthenticatedContext(
  context: ServiceContext,
): asserts context is AuthenticatedServiceContext {
  if (!context.session) {
    throw new UnauthorizedError();
  }
}
