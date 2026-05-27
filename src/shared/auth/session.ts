import { redirect } from 'next/navigation';
import { defaultAuthProvider } from '@/shared/auth/provider';
import { createSupabaseServerClient } from '@/shared/supabase/server';

/** Supabase `auth.users` row — JWT-validated via `getUser()` (replay-safe). */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  return defaultAuthProvider.getUser(supabase);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
