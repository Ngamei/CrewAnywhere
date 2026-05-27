import { AuthenticatedBaseService } from '@/backend/services/base-service';

export class IdentityService extends AuthenticatedBaseService {
  async getCurrentAccount() {
    const { identity } = this.requirePlatformSession();

    const { data, error } = await this.context.supabase
      .from('auth_accounts')
      .select(
        'id, auth_user_id, email, account_type, provider, provider_subject, status, last_login_at, created_at, updated_at',
      )
      .eq('id', identity.authAccount.id)
      .single();

    if (error) {
      throw error;
    }

    return {
      account: data,
      businessUser: identity.businessUser,
      crewUser: identity.crewUser,
      role: identity.role,
    };
  }
}
