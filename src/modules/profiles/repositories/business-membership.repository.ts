import { BaseRepository } from '@/backend/repositories/base-repository';
import type { BusinessMembershipRecord } from '@/modules/profiles/types/profile-records';
import type { UpdateBusinessMembershipInput } from '@/modules/profiles/schemas';
import type { ProfileRepositoryClients } from './profile-repository-clients';

const MEMBERSHIP_COLUMNS =
  'id, auth_account_id, role, first_name, last_name, phone, created_at, updated_at, deleted_at';

export class BusinessMembershipRepository extends BaseRepository {
  constructor(private readonly clients: ProfileRepositoryClients) {
    super(clients.read);
  }

  async findById(businessUserId: string): Promise<BusinessMembershipRecord | null> {
    const { data, error } = await this.clients.read
      .from('business_users')
      .select(MEMBERSHIP_COLUMNS)
      .eq('id', businessUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as BusinessMembershipRecord | null;
  }

  async findByAuthAccountId(authAccountId: string): Promise<BusinessMembershipRecord | null> {
    const { data, error } = await this.clients.read
      .from('business_users')
      .select(MEMBERSHIP_COLUMNS)
      .eq('auth_account_id', authAccountId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as BusinessMembershipRecord | null;
  }

  async updateMembership(
    businessUserId: string,
    input: UpdateBusinessMembershipInput,
  ): Promise<BusinessMembershipRecord> {
    const patch: Record<string, unknown> = {};

    if (input.firstName !== undefined) patch.first_name = input.firstName;
    if (input.lastName !== undefined) patch.last_name = input.lastName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.role !== undefined) patch.role = input.role;

    const { data, error } = await this.clients.write
      .from('business_users')
      .update(patch)
      .eq('id', businessUserId)
      .is('deleted_at', null)
      .select(MEMBERSHIP_COLUMNS)
      .single();

    if (error) throw error;
    return data as BusinessMembershipRecord;
  }
}
