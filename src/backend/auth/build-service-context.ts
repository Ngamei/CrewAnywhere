import type { SupabaseClient } from '@supabase/supabase-js';
import { resolvePlatformSession } from '@/backend/auth/platform-session';
import { createRequestId, type ServiceContext } from '@/backend/services/service-context';

export type BuildServiceContextInput = {
  supabase: SupabaseClient;
  requestId?: string;
};

export async function buildServiceContext(input: BuildServiceContextInput): Promise<ServiceContext> {
  const session = await resolvePlatformSession(input.supabase);

  return {
    supabase: input.supabase,
    user: session?.supabaseUser ?? null,
    session,
    requestId: input.requestId ?? createRequestId(),
  };
}
