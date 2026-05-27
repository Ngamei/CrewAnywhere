import { createClient } from '@supabase/supabase-js';
import { assertSupabasePublicEnv, env } from '@/shared/config/env';

export function createSupabaseAdminClient() {
  assertSupabasePublicEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
