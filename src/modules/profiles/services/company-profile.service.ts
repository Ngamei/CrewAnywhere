import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { NotFoundError } from '@/shared/api/errors';
import { assertBusinessUser } from '@/shared/auth/guards';
import {
  assertBusinessRoleCanManageCompany,
  assertCanManageCompany,
  assertCompanyProfileAccess,
  computeCompanyProfileCompletion,
} from '@/modules/profiles/hooks';
import {
  CompanyProfileRepository,
  createProfileRepositoryClients,
} from '@/modules/profiles/repositories';
import type {
  CreateCompanyProfileInput,
  UpdateCompanyFinanceInput,
  UpdateCompanyProfileInput,
} from '@/modules/profiles/schemas';
import type { CompanyProfileDto, CompanyProfileListItemDto } from '@/modules/profiles/types';
import { ProfileReadinessService } from './profile-readiness.service';

export class CompanyProfileService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private readonly readiness = new ProfileReadinessService();

  private getRepository() {
    return new CompanyProfileRepository(createProfileRepositoryClients(this.context.supabase));
  }

  async listOwnedCompanies(): Promise<CompanyProfileListItemDto[]> {
    const { identity } = this.requirePlatformSession();
    const businessUser = assertBusinessUser(identity);
    assertCanManageCompany(identity);
    assertBusinessRoleCanManageCompany(businessUser.role);

    const profiles = await this.getRepository().listByOwnerBusinessUserId(businessUser.id);

    return profiles.map((p) => ({
      id: p.id,
      company_name: p.company_name,
      status: p.status,
      business_ready: p.business_ready,
      verified_business: p.verified_business,
      updated_at: p.updated_at,
    }));
  }

  async getCompanyProfile(companyProfileId: string): Promise<CompanyProfileDto> {
    const { identity } = this.requirePlatformSession();
    const repo = this.getRepository();
    const profile = await repo.findById(companyProfileId);

    if (!profile) {
      throw new NotFoundError('Company profile not found.');
    }

    assertCompanyProfileAccess(identity, profile);

    const [finance, kyb] = await Promise.all([
      repo.findFinanceByCompanyId(companyProfileId),
      repo.findLatestKybByCompanyId(companyProfileId),
    ]);

    const completion = computeCompanyProfileCompletion({ profile, finance, kyb });

    return { ...profile, finance, kyb, completion };
  }

  async createCompanyProfile(input: CreateCompanyProfileInput): Promise<CompanyProfileDto> {
    const { identity } = this.requirePlatformSession();
    const businessUser = assertBusinessUser(identity);
    assertCanManageCompany(identity);
    assertBusinessRoleCanManageCompany(businessUser.role);

    const repo = this.getRepository();
    const profile = await repo.createForOwner(businessUser.id, input);
    const finance = await repo.findFinanceByCompanyId(profile.id);

    const completion = computeCompanyProfileCompletion({
      profile,
      finance,
      kyb: null,
    });

    return { ...profile, finance, kyb: null, completion };
  }

  async updateCompanyProfile(
    companyProfileId: string,
    input: UpdateCompanyProfileInput,
  ): Promise<CompanyProfileDto> {
    const { identity } = this.requirePlatformSession();
    const repo = this.getRepository();
    const existing = await repo.findById(companyProfileId);

    if (!existing) {
      throw new NotFoundError('Company profile not found.');
    }

    assertCompanyProfileAccess(identity, existing);

    const profile = await repo.updateProfile(companyProfileId, input);
    const [finance, kyb] = await Promise.all([
      repo.findFinanceByCompanyId(companyProfileId),
      repo.findLatestKybByCompanyId(companyProfileId),
    ]);

    await this.syncBusinessReady(repo, profile, finance, kyb);

    const refreshed = await repo.findById(companyProfileId);
    if (!refreshed) {
      throw new NotFoundError('Company profile not found after update.');
    }

    const completion = computeCompanyProfileCompletion({
      profile: refreshed,
      finance,
      kyb,
    });

    return { ...refreshed, finance, kyb, completion };
  }

  async updateCompanyFinance(
    companyProfileId: string,
    input: UpdateCompanyFinanceInput,
  ): Promise<CompanyProfileDto> {
    const { identity } = this.requirePlatformSession();
    const repo = this.getRepository();
    const existing = await repo.findById(companyProfileId);

    if (!existing) {
      throw new NotFoundError('Company profile not found.');
    }

    assertCompanyProfileAccess(identity, existing);

    const finance = await repo.updateFinance(companyProfileId, input);
    const kyb = await repo.findLatestKybByCompanyId(companyProfileId);

    await this.syncBusinessReady(repo, existing, finance, kyb);

    const profile = await repo.findById(companyProfileId);
    if (!profile) {
      throw new NotFoundError('Company profile not found after finance update.');
    }

    const completion = computeCompanyProfileCompletion({ profile, finance, kyb });

    return { ...profile, finance, kyb, completion };
  }

  async getCompanyReadiness(companyProfileId: string) {
    const dto = await this.getCompanyProfile(companyProfileId);
    return this.readiness.evaluateCompany({
      profile: dto,
      finance: dto.finance,
      kyb: dto.kyb,
    });
  }

  private async syncBusinessReady(
    repo: CompanyProfileRepository,
    profile: Awaited<ReturnType<CompanyProfileRepository['findById']>> & object,
    finance: Awaited<ReturnType<CompanyProfileRepository['findFinanceByCompanyId']>>,
    kyb: Awaited<ReturnType<CompanyProfileRepository['findLatestKybByCompanyId']>>,
  ) {
    if (!profile) return;

    const shouldBeReady = this.readiness.deriveBusinessReady({
      profile,
      finance,
      kyb,
    });

    if (profile.business_ready !== shouldBeReady) {
      await repo.syncBusinessReadyFlag(profile.id, shouldBeReady);
    }
  }
}
