import type { AccountType } from '@/shared/auth/enums';

/** Signup account type selection — maps to `public.account_type` (crew | business). */
export type OnboardingAccountType = Extract<AccountType, 'crew' | 'business'>;

export type AuthOnboardingStep = 'welcome' | 'account_type' | 'complete';

export type AuthOnboardingProgress = {
  accountType: OnboardingAccountType | null;
  currentStep: AuthOnboardingStep;
  isComplete: boolean;
  completedAt: string | null;
};
