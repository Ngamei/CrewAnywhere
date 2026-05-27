import { redirect } from 'next/navigation';
import { resolvePlatformSession } from '@/backend/auth/platform-session';
import type { PlatformSession } from '@/shared/auth/types';
import { createSupabaseServerClient } from '@/shared/supabase/server';

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const supabase = await createSupabaseServerClient();
  return resolvePlatformSession(supabase);
}

export async function requirePlatformSession(): Promise<PlatformSession> {
  const session = await getPlatformSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}
