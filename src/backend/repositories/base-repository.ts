import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository {
  protected constructor(protected readonly supabase: SupabaseClient) {}
}
