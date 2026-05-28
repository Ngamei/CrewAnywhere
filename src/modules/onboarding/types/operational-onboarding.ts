import type { AccountType } from '@/shared/auth/enums';
import type { Permission } from '@/shared/auth/permissions';
import type { UserRole } from '@/shared/auth/roles';

/** Client-tracked operational milestones (profile readiness is API-derived). */
export type OperationalMilestoneId =
  | 'profile_complete'
  | 'first_event'
  | 'first_job'
  | 'first_proposal'
  | 'first_shift'
  | 'marketplace_apply'
  | 'wallet_setup'
  | 'operational_active';

export type OnboardingStepStatus = 'complete' | 'current' | 'upcoming';

export type OnboardingStep = {
  id: OperationalMilestoneId;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  status: OnboardingStepStatus;
  complete: boolean;
};

export type OnboardingStepDefinition = {
  id: OperationalMilestoneId;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  accountTypes: AccountType[];
  roles?: readonly UserRole[];
  permission?: Permission;
  order: number;
};

export type OnboardingProgressState = {
  dismissedBannerIds: string[];
  acknowledgedMilestones: Partial<Record<OperationalMilestoneId, string>>;
};

export const ONBOARDING_STORAGE_KEY = 'crewanywhere:operational-onboarding:v1';

export const DASHBOARD_ONBOARDING_BANNER_ID = 'dashboard-operational-banner';
