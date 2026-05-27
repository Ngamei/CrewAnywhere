import type {
  BusinessFinanceRecord,
  BusinessMembershipRecord,
  CompanyProfileRecord,
  CrewExperienceRecord,
  CrewProfileRecord,
  CrewSkillRecord,
  KybRecord,
  KycRecord,
} from './profile-records';
import type { ProfileCompletionState } from './profile-workflow';

export type CompanyProfileDto = CompanyProfileRecord & {
  finance: BusinessFinanceRecord | null;
  kyb: KybRecord | null;
  completion: ProfileCompletionState;
};

export type CrewProfileDto = CrewProfileRecord & {
  skills: CrewSkillRecord[];
  experience: CrewExperienceRecord[];
  kyc: KycRecord | null;
  completion: ProfileCompletionState;
};

export type BusinessMembershipDto = BusinessMembershipRecord & {
  canManageCompany: boolean;
  isOwner: boolean;
};

export type CompanyProfileListItemDto = Pick<
  CompanyProfileRecord,
  'id' | 'company_name' | 'status' | 'business_ready' | 'verified_business' | 'updated_at'
>;

export type CrewSkillDto = CrewSkillRecord;
export type CrewExperienceDto = CrewExperienceRecord;
