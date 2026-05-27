import type {
  BusinessFinanceRecord,
  CompanyProfileRecord,
  CrewExperienceRecord,
  CrewProfileRecord,
  CrewSkillRecord,
  KybRecord,
  KycRecord,
} from '@/modules/profiles/types/profile-records';
import type {
  ProfileCompletionSection,
  ProfileCompletionState,
  ProfileOnboardingPhase,
  ProfileReadinessSnapshot,
} from '@/modules/profiles/types/profile-workflow';

function computePercent(sections: ProfileCompletionSection[]) {
  const required = sections.filter((s) => s.required);
  if (required.length === 0) return 100;

  const complete = required.filter((s) => s.complete).length;
  return Math.round((complete / required.length) * 100);
}

function buildState(sections: ProfileCompletionSection[], operationalReady: boolean): ProfileCompletionState {
  const percentComplete = computePercent(sections);
  const requiredSections = sections.filter((s) => s.required);
  const onboardingComplete = requiredSections.every((s) => s.complete);
  const verificationReady = sections.find((s) => s.key === 'verification')?.complete ?? false;

  return {
    percentComplete,
    sections,
    onboardingComplete,
    verificationReady,
    operationalReady,
  };
}

export function computeCompanyProfileCompletion(input: {
  profile: CompanyProfileRecord;
  finance: BusinessFinanceRecord | null;
  kyb: KybRecord | null;
}): ProfileCompletionState {
  const { profile, finance, kyb } = input;

  const sections: ProfileCompletionSection[] = [
    {
      key: 'basic_info',
      label: 'Company details',
      complete: Boolean(profile.company_name?.trim()),
      required: true,
    },
    {
      key: 'legal_info',
      label: 'Legal identity',
      complete: Boolean(profile.legal_name?.trim() && profile.registration_number?.trim()),
      required: true,
    },
    {
      key: 'finance_setup',
      label: 'Billing & tax',
      complete: Boolean(
        finance?.billing_email?.trim() &&
          finance.payment_setup_completed &&
          finance.tax_setup_completed,
      ),
      required: true,
    },
    {
      key: 'verification',
      label: 'Business verification (KYB)',
      complete: kyb?.status === 'approved' || profile.verified_business,
      required: true,
    },
  ];

  const operationalReady = profile.business_ready && profile.status === 'active';

  return buildState(sections, operationalReady);
}

export function computeCrewProfileCompletion(input: {
  profile: CrewProfileRecord;
  skills: CrewSkillRecord[];
  experience: CrewExperienceRecord[];
  kyc: KycRecord | null;
}): ProfileCompletionState {
  const { profile, skills, experience, kyc } = input;

  const sections: ProfileCompletionSection[] = [
    {
      key: 'basic_info',
      label: 'Profile basics',
      complete: Boolean(profile.display_name?.trim() && profile.introduction?.trim()),
      required: true,
    },
    {
      key: 'location',
      label: 'Location',
      complete: Boolean(profile.city?.trim() && profile.country_code),
      required: true,
    },
    {
      key: 'skills',
      label: 'Skills',
      complete: skills.length > 0,
      required: true,
    },
    {
      key: 'experience',
      label: 'Experience',
      complete: experience.length > 0,
      required: false,
    },
    {
      key: 'rates',
      label: 'Hourly rate',
      complete: profile.hourly_rate_amount != null && profile.hourly_rate_amount > 0,
      required: true,
    },
    {
      key: 'verification',
      label: 'Identity verification (KYC)',
      complete: kyc?.status === 'approved',
      required: true,
    },
    {
      key: 'publish',
      label: 'Marketplace publish',
      complete: profile.profile_published && profile.marketplace_ready,
      required: false,
    },
  ];

  const operationalReady =
    profile.marketplace_ready && profile.profile_published && (kyc?.status === 'approved');

  return buildState(sections, operationalReady);
}

export function resolveOnboardingPhase(completion: ProfileCompletionState): ProfileOnboardingPhase {
  if (completion.operationalReady) return 'ready';
  if (completion.verificationReady && !completion.onboardingComplete) return 'verification_pending';
  if (completion.percentComplete === 0) return 'not_started';
  return 'in_progress';
}

export function buildCompanyReadinessSnapshot(input: {
  profile: CompanyProfileRecord;
  finance: BusinessFinanceRecord | null;
  kyb: KybRecord | null;
}): ProfileReadinessSnapshot {
  const completion = computeCompanyProfileCompletion(input);

  return {
    completion,
    onboardingPhase: resolveOnboardingPhase(completion),
    verificationStatus: input.kyb?.status ?? null,
    marketplaceReady: false,
    businessReady: input.profile.business_ready,
  };
}

export function buildCrewReadinessSnapshot(input: {
  profile: CrewProfileRecord;
  skills: CrewSkillRecord[];
  experience: CrewExperienceRecord[];
  kyc: KycRecord | null;
}): ProfileReadinessSnapshot {
  const completion = computeCrewProfileCompletion(input);

  return {
    completion,
    onboardingPhase: resolveOnboardingPhase(completion),
    verificationStatus: input.kyc?.status ?? null,
    marketplaceReady: input.profile.marketplace_ready,
    businessReady: false,
  };
}
