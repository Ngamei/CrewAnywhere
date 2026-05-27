import { BaseRepository } from '@/backend/repositories/base-repository';
import type {
  CrewExperienceRecord,
  CrewProfileRecord,
  CrewSkillRecord,
  KycRecord,
} from '@/modules/profiles/types/profile-records';
import type {
  CreateCrewProfileInput,
  UpdateCrewProfileInput,
  UpsertCrewExperienceInput,
  UpsertCrewSkillInput,
} from '@/modules/profiles/schemas';
import type { ProfileRepositoryClients } from './profile-repository-clients';

const PROFILE_COLUMNS =
  'id, crew_user_id, display_name, legal_name, date_of_birth, gender, city, country_code, introduction, profile_image_url, hourly_rate_amount, hourly_rate_currency, profile_published, marketplace_ready, profile_score, created_at, updated_at, deleted_at';

const SKILL_COLUMNS =
  'id, crew_user_id, skill_name, skill_category, verified_at, created_at, updated_at, deleted_at';

const EXPERIENCE_COLUMNS =
  'id, crew_user_id, company_name, role_title, description, starts_on, ends_on, created_at, updated_at, deleted_at';

const KYC_COLUMNS =
  'id, crew_user_id, status, status_version, document_type, provider, provider_reference, submitted_at, approved_at, rejected_reason, metadata, created_at, updated_at, deleted_at';

export class CrewProfileRepository extends BaseRepository {
  constructor(private readonly clients: ProfileRepositoryClients) {
    super(clients.read);
  }

  async findByCrewUserId(crewUserId: string): Promise<CrewProfileRecord | null> {
    const { data, error } = await this.clients.read
      .from('crew_profiles')
      .select(PROFILE_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as CrewProfileRecord | null;
  }

  async listSkills(crewUserId: string): Promise<CrewSkillRecord[]> {
    const { data, error } = await this.clients.read
      .from('crew_skills')
      .select(SKILL_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as CrewSkillRecord[];
  }

  async listExperience(crewUserId: string): Promise<CrewExperienceRecord[]> {
    const { data, error } = await this.clients.read
      .from('crew_experience')
      .select(EXPERIENCE_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .order('starts_on', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data ?? []) as CrewExperienceRecord[];
  }

  async findLatestKyc(crewUserId: string): Promise<KycRecord | null> {
    const { data, error } = await this.clients.read
      .from('kyc_records')
      .select(KYC_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as KycRecord | null;
  }

  async createForCrewUser(crewUserId: string, input: CreateCrewProfileInput): Promise<CrewProfileRecord> {
    const { data, error } = await this.clients.write
      .from('crew_profiles')
      .insert({
        crew_user_id: crewUserId,
        display_name: input.displayName,
        legal_name: input.legalName ?? null,
        city: input.city ?? null,
        country_code: input.countryCode ?? null,
        introduction: input.introduction ?? null,
        profile_image_url: input.profileImageUrl ?? null,
        hourly_rate_amount: input.hourlyRateAmount ?? null,
        hourly_rate_currency: input.hourlyRateCurrency ?? 'USD',
      })
      .select(PROFILE_COLUMNS)
      .single();

    if (error) throw error;
    return data as CrewProfileRecord;
  }

  async updateProfile(crewUserId: string, input: UpdateCrewProfileInput): Promise<CrewProfileRecord> {
    const patch: Record<string, unknown> = {};

    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.legalName !== undefined) patch.legal_name = input.legalName;
    if (input.city !== undefined) patch.city = input.city;
    if (input.countryCode !== undefined) patch.country_code = input.countryCode;
    if (input.introduction !== undefined) patch.introduction = input.introduction;
    if (input.profileImageUrl !== undefined) patch.profile_image_url = input.profileImageUrl;
    if (input.hourlyRateAmount !== undefined) patch.hourly_rate_amount = input.hourlyRateAmount;
    if (input.hourlyRateCurrency !== undefined) patch.hourly_rate_currency = input.hourlyRateCurrency;

    const { data, error } = await this.clients.write
      .from('crew_profiles')
      .update(patch)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) throw error;
    return data as CrewProfileRecord;
  }

  async addSkill(crewUserId: string, input: UpsertCrewSkillInput): Promise<CrewSkillRecord> {
    const { data, error } = await this.clients.write
      .from('crew_skills')
      .insert({
        crew_user_id: crewUserId,
        skill_name: input.skillName,
        skill_category: input.skillCategory ?? null,
      })
      .select(SKILL_COLUMNS)
      .single();

    if (error) throw error;
    return data as CrewSkillRecord;
  }

  async removeSkill(crewUserId: string, skillId: string): Promise<void> {
    const { error } = await this.clients.write
      .from('crew_skills')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', skillId)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null);

    if (error) throw error;
  }

  async addExperience(
    crewUserId: string,
    input: UpsertCrewExperienceInput,
  ): Promise<CrewExperienceRecord> {
    const { data, error } = await this.clients.write
      .from('crew_experience')
      .insert({
        crew_user_id: crewUserId,
        company_name: input.companyName ?? null,
        role_title: input.roleTitle,
        description: input.description ?? null,
        starts_on: input.startsOn ?? null,
        ends_on: input.endsOn ?? null,
      })
      .select(EXPERIENCE_COLUMNS)
      .single();

    if (error) throw error;
    return data as CrewExperienceRecord;
  }

  async removeExperience(crewUserId: string, experienceId: string): Promise<void> {
    const { error } = await this.clients.write
      .from('crew_experience')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', experienceId)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null);

    if (error) throw error;
  }

  async syncMarketplaceFlags(
    crewUserId: string,
    flags: { marketplaceReady?: boolean; profilePublished?: boolean; profileScore?: number },
  ): Promise<CrewProfileRecord> {
    const patch: Record<string, unknown> = {};
    if (flags.marketplaceReady !== undefined) patch.marketplace_ready = flags.marketplaceReady;
    if (flags.profilePublished !== undefined) patch.profile_published = flags.profilePublished;
    if (flags.profileScore !== undefined) patch.profile_score = flags.profileScore;

    const { data, error } = await this.clients.write
      .from('crew_profiles')
      .update(patch)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) throw error;
    return data as CrewProfileRecord;
  }
}
