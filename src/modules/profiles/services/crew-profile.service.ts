import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { ConflictError, NotFoundError } from '@/shared/api/errors';
import { assertCrewUser } from '@/shared/auth/guards';
import {
  assertCanAccessCrewMarketplace,
  assertCrewProfileAccess,
  computeCrewProfileCompletion,
} from '@/modules/profiles/hooks';
import {
  CrewProfileRepository,
  createProfileRepositoryClients,
} from '@/modules/profiles/repositories';
import type {
  CreateCrewProfileInput,
  UpdateCrewProfileInput,
  UpsertCrewExperienceInput,
  UpsertCrewSkillInput,
} from '@/modules/profiles/schemas';
import type { CrewProfileDto } from '@/modules/profiles/types';
import { ProfileReadinessService } from './profile-readiness.service';

export class CrewProfileService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private readonly readiness = new ProfileReadinessService();

  private getRepository() {
    return new CrewProfileRepository(createProfileRepositoryClients(this.context.supabase));
  }

  private async loadCrewBundle(crewUserId: string): Promise<CrewProfileDto> {
    const repo = this.getRepository();
    const profile = await repo.findByCrewUserId(crewUserId);

    if (!profile) {
      throw new NotFoundError('Crew profile not found.');
    }

    const [skills, experience, kyc] = await Promise.all([
      repo.listSkills(crewUserId),
      repo.listExperience(crewUserId),
      repo.findLatestKyc(crewUserId),
    ]);

    const completion = computeCrewProfileCompletion({
      profile,
      skills,
      experience,
      kyc,
    });

    return { ...profile, skills, experience, kyc, completion };
  }

  async getMyCrewProfile(): Promise<CrewProfileDto> {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);
    assertCanAccessCrewMarketplace(identity);

    return this.loadCrewBundle(crewUser.id);
  }

  async createCrewProfile(input: CreateCrewProfileInput): Promise<CrewProfileDto> {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);
    assertCanAccessCrewMarketplace(identity);

    const repo = this.getRepository();
    const existing = await repo.findByCrewUserId(crewUser.id);

    if (existing) {
      throw new ConflictError('Crew profile already exists.');
    }

    await repo.createForCrewUser(crewUser.id, input);
    return this.loadCrewBundle(crewUser.id);
  }

  async updateMyCrewProfile(input: UpdateCrewProfileInput): Promise<CrewProfileDto> {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);
    assertCanAccessCrewMarketplace(identity);

    const repo = this.getRepository();
    const existing = await repo.findByCrewUserId(crewUser.id);

    if (!existing) {
      throw new NotFoundError('Crew profile not found.');
    }

    await repo.updateProfile(crewUser.id, input);
    await this.syncMarketplaceReadiness(crewUser.id);

    return this.loadCrewBundle(crewUser.id);
  }

  async addSkill(input: UpsertCrewSkillInput) {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);
    assertCanAccessCrewMarketplace(identity);

    const repo = this.getRepository();
    await this.ensureCrewProfileExists(repo, crewUser.id);

    const skill = await repo.addSkill(crewUser.id, input);
    await this.syncMarketplaceReadiness(crewUser.id);

    return skill;
  }

  async removeSkill(skillId: string) {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);
    assertCrewProfileAccess(identity, crewUser.id);

    const repo = this.getRepository();
    await repo.removeSkill(crewUser.id, skillId);
    await this.syncMarketplaceReadiness(crewUser.id);
  }

  async addExperience(input: UpsertCrewExperienceInput) {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);
    assertCanAccessCrewMarketplace(identity);

    const repo = this.getRepository();
    await this.ensureCrewProfileExists(repo, crewUser.id);

    const experience = await repo.addExperience(crewUser.id, input);
    await this.syncMarketplaceReadiness(crewUser.id);

    return experience;
  }

  async removeExperience(experienceId: string) {
    const { identity } = this.requirePlatformSession();
    const crewUser = assertCrewUser(identity);
    assertCrewProfileAccess(identity, crewUser.id);

    const repo = this.getRepository();
    await repo.removeExperience(crewUser.id, experienceId);
    await this.syncMarketplaceReadiness(crewUser.id);
  }

  async getCrewReadiness() {
    const dto = await this.getMyCrewProfile();
    return this.readiness.evaluateCrew({
      profile: dto,
      skills: dto.skills,
      experience: dto.experience,
      kyc: dto.kyc,
    });
  }

  private async ensureCrewProfileExists(repo: CrewProfileRepository, crewUserId: string) {
    const profile = await repo.findByCrewUserId(crewUserId);
    if (!profile) {
      throw new NotFoundError('Crew profile not found.');
    }
  }

  private async syncMarketplaceReadiness(crewUserId: string) {
    const repo = this.getRepository();
    const profile = await repo.findByCrewUserId(crewUserId);
    if (!profile) return;

    const [skills, experience, kyc] = await Promise.all([
      repo.listSkills(crewUserId),
      repo.listExperience(crewUserId),
      repo.findLatestKyc(crewUserId),
    ]);

    const marketplaceReady = this.readiness.deriveCrewMarketplaceReady({
      profile,
      skills,
      experience,
      kyc,
    });

    const completion = computeCrewProfileCompletion({ profile, skills, experience, kyc });

    if (
      profile.marketplace_ready !== marketplaceReady ||
      profile.profile_score !== completion.percentComplete
    ) {
      await repo.syncMarketplaceFlags(crewUserId, {
        marketplaceReady,
        profileScore: completion.percentComplete,
      });
    }
  }
}
