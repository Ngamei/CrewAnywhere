import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/shared/supabase/admin';

/**
 * Domain mutations bypass user RLS — writes use service role after app-layer ownership checks.
 */
export type DomainRepositoryClients = {
  read: SupabaseClient;
  write: SupabaseClient;
};

export function createDomainRepositoryClients(readClient: SupabaseClient): DomainRepositoryClients {
  return {
    read: readClient,
    write: createSupabaseAdminClient(),
  };
}
