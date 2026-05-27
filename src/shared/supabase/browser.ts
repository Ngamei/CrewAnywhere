import { createBrowserClient } from '@supabase/ssr';
import { assertSupabasePublicEnv, env } from '@/shared/config/env';

export function createSupabaseBrowserClient() {
  assertSupabasePublicEnv();

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
