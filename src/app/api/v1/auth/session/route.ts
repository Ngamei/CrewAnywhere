import { resolvePlatformSession } from '@/backend/auth/platform-session';
import { ok } from '@/shared/api/responses';
import { defaultAuthProvider } from '@/shared/auth/provider';
import { toPlatformSessionPayload, type AuthSessionResponse } from '@/shared/auth/types';
import { createSupabaseServerClient } from '@/shared/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const supabaseUser = await defaultAuthProvider.getUser(supabase);

  if (!supabaseUser) {
    return ok({ authenticated: false } satisfies AuthSessionResponse);
  }

  const session = await resolvePlatformSession(supabase);

  if (session) {
    return ok(toPlatformSessionPayload(session));
  }

  return ok({
    authenticated: true,
    phase: 'identity_pending',
    user: {
      id: supabaseUser.id,
      email: supabaseUser.email,
    },
  } satisfies AuthSessionResponse);
}
