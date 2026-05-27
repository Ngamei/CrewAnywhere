import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { ForbiddenError, NotFoundError } from '@/shared/api/errors';
import { assertBusinessUser } from '@/shared/auth/guards';
import { ownsCompanyProfile } from '@/shared/auth/ownership';
import {
  assertBusinessRoleCanManageCompany,
  assertCanManageCompany,
} from '@/modules/profiles/hooks';
import {
  BusinessMembershipRepository,
  CompanyProfileRepository,
  createProfileRepositoryClients,
} from '@/modules/profiles/repositories';
import type { UpdateBusinessMembershipInput } from '@/modules/profiles/schemas';
import type { BusinessMembershipDto } from '@/modules/profiles/types';

export class BusinessMembershipService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getMembershipRepository() {
    return new BusinessMembershipRepository(createProfileRepositoryClients(this.context.supabase));
  }

  private getCompanyRepository() {
    return new CompanyProfileRepository(createProfileRepositoryClients(this.context.supabase));
  }

  async getCurrentMembership(): Promise<BusinessMembershipDto> {
    const { identity } = this.requirePlatformSession();
    const businessUser = assertBusinessUser(identity);

    return this.toDto(businessUser);
  }

  async updateCurrentMembership(input: UpdateBusinessMembershipInput): Promise<BusinessMembershipDto> {
    const { identity } = this.requirePlatformSession();
    const businessUser = assertBusinessUser(identity);

    if (input.role !== undefined && businessUser.role !== 'owner' && identity.role !== 'platform_admin') {
      throw new ForbiddenError('Only business owners can change membership roles.');
    }

    const repo = this.getMembershipRepository();
    const updated = await repo.updateMembership(businessUser.id, input);

    return this.toDto(updated);
  }

  /**
   * Validates that the current business user owns the company profile.
   * Replay-safe: read-only ownership check before mutating workflows.
   */
  async validateCompanyOwnership(companyProfileId: string): Promise<{ valid: true; companyProfileId: string }> {
    const { identity } = this.requirePlatformSession();
    assertCanManageCompany(identity);

    const businessUser = assertBusinessUser(identity);
    const profile = await this.getCompanyRepository().findById(companyProfileId);

    if (!profile) {
      throw new NotFoundError('Company profile not found.');
    }

    if (!ownsCompanyProfile(identity, profile.owner_business_user_id)) {
      throw new ForbiddenError('You do not own this company profile.');
    }

    assertBusinessRoleCanManageCompany(businessUser.role);

    return { valid: true, companyProfileId };
  }

  private toDto(record: {
    id: string;
    auth_account_id: string;
    role: BusinessMembershipDto['role'];
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }): BusinessMembershipDto {
    return {
      ...record,
      canManageCompany: record.role === 'owner' || record.role === 'admin',
      isOwner: record.role === 'owner',
    };
  }
}
