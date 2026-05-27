import {
  buildCompanyReadinessSnapshot,
  buildCrewReadinessSnapshot,
  computeCompanyProfileCompletion,
  computeCrewProfileCompletion,
} from '@/modules/profiles/hooks/profile-completion';
import type {
  BusinessFinanceRecord,
  CompanyProfileRecord,
  CrewExperienceRecord,
  CrewProfileRecord,
  CrewSkillRecord,
  KybRecord,
  KycRecord,
} from '@/modules/profiles/types/profile-records';
import type { ProfileReadinessSnapshot } from '@/modules/profiles/types/profile-workflow';

export class ProfileReadinessService {
  evaluateCompany(input: {
    profile: CompanyProfileRecord;
    finance: BusinessFinanceRecord | null;
    kyb: KybRecord | null;
  }): ProfileReadinessSnapshot {
    return buildCompanyReadinessSnapshot(input);
  }

  evaluateCrew(input: {
    profile: CrewProfileRecord;
    skills: CrewSkillRecord[];
    experience: CrewExperienceRecord[];
    kyc: KycRecord | null;
  }): ProfileReadinessSnapshot {
    return buildCrewReadinessSnapshot(input);
  }

  deriveBusinessReady(input: {
    profile: CompanyProfileRecord;
    finance: BusinessFinanceRecord | null;
    kyb: KybRecord | null;
  }): boolean {
    const completion = computeCompanyProfileCompletion(input);
    return completion.onboardingComplete && completion.verificationReady;
  }

  deriveCrewMarketplaceReady(input: {
    profile: CrewProfileRecord;
    skills: CrewSkillRecord[];
    experience: CrewExperienceRecord[];
    kyc: KycRecord | null;
  }): boolean {
    const completion = computeCrewProfileCompletion(input);
    return completion.onboardingComplete && completion.verificationReady;
  }
}
