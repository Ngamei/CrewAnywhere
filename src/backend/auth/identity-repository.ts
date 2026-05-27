import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AuthAccountRecord,
  BusinessUserRecord,
  CrewUserRecord,
} from '@/shared/auth/types';

export class IdentityRepository {
  constructor(protected readonly supabase: SupabaseClient) {}
  async findAuthAccountByAuthUserId(authUserId: string): Promise<AuthAccountRecord | null> {
    const { data, error } = await this.supabase
      .from('auth_accounts')
      .select(
        'id, auth_user_id, email, account_type, provider, provider_subject, status, last_login_at, created_at, updated_at, deleted_at',
      )
      .eq('auth_user_id', authUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as AuthAccountRecord | null;
  }

  async findBusinessUserByAuthAccountId(authAccountId: string): Promise<BusinessUserRecord | null> {
    const { data, error } = await this.supabase
      .from('business_users')
      .select('id, auth_account_id, role, first_name, last_name, phone, created_at, updated_at, deleted_at')
      .eq('auth_account_id', authAccountId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as BusinessUserRecord | null;
  }

  async findCrewUserByAuthAccountId(authAccountId: string): Promise<CrewUserRecord | null> {
    const { data, error } = await this.supabase
      .from('crew_users')
      .select('id, auth_account_id, phone, created_at, updated_at, deleted_at')
      .eq('auth_account_id', authAccountId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as CrewUserRecord | null;
  }
}
