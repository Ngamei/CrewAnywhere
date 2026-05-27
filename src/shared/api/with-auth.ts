import type { NextRequest } from 'next/server';
import { AppError } from '@/shared/api/errors';
import { fail } from '@/shared/api/responses';
import { runAuthenticatedAction, runOptionalAuthAction } from '@/backend/auth/authenticated-action';
import type { AuthenticatedServiceContext, ServiceContext } from '@/backend/services/service-context';
import { createRequestId } from '@/backend/services/service-context';
import { createSupabaseServerClient } from '@/shared/supabase/server';

type RouteContext = {
  params?: Promise<Record<string, string>>;
};

type AuthenticatedRouteHandler = (
  request: NextRequest,
  context: AuthenticatedServiceContext,
  routeContext: RouteContext,
) => Promise<Response>;

type OptionalAuthRouteHandler = (
  request: NextRequest,
  context: ServiceContext,
  routeContext: RouteContext,
) => Promise<Response>;

function handleRouteError(error: unknown, requestId: string) {
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.status, error.details, { requestId });
  }

  console.error('[withAuth]', error);
  return fail('INTERNAL_ERROR', 'An unexpected error occurred.', 500, undefined, { requestId });
}

export function withAuth(handler: AuthenticatedRouteHandler) {
  return async (request: NextRequest, routeContext: RouteContext = {}) => {
    const requestId = createRequestId();

    try {
      const supabase = await createSupabaseServerClient();

      return await runAuthenticatedAction({ supabase, requestId }, (context) =>
        handler(request, context, routeContext),
      );
    } catch (error) {
      return handleRouteError(error, requestId);
    }
  };
}

export function withOptionalAuth(handler: OptionalAuthRouteHandler) {
  return async (request: NextRequest, routeContext: RouteContext = {}) => {
    const requestId = createRequestId();

    try {
      const supabase = await createSupabaseServerClient();

      return await runOptionalAuthAction({ supabase, requestId }, (context) =>
        handler(request, context, routeContext),
      );
    } catch (error) {
      return handleRouteError(error, requestId);
    }
  };
}
