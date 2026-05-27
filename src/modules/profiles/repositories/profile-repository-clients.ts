import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/shared/supabase/admin';

/**
 * Profile mutations bypass user RLS — writes use service role after app-layer ownership checks.
 */
export type ProfileRepositoryClients = {
  read: SupabaseClient;
  write: SupabaseClient;
};

export function createProfileRepositoryClients(readClient: SupabaseClient): ProfileRepositoryClients {
  return {
    read: readClient,
    write: createSupabaseAdminClient(),
  };
}
