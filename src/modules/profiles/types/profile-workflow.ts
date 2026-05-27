/**
 * Profile onboarding and operational readiness — application-layer state
 * derived from persisted records (not a separate workflow entity).
 */

export type ProfileCompletionSectionKey =
  | 'basic_info'
  | 'legal_info'
  | 'finance_setup'
  | 'verification'
  | 'location'
  | 'skills'
  | 'experience'
  | 'rates'
  | 'publish';

export type ProfileCompletionSection = {
  key: ProfileCompletionSectionKey;
  label: string;
  complete: boolean;
  required: boolean;
};

export type ProfileCompletionState = {
  percentComplete: number;
  sections: ProfileCompletionSection[];
  onboardingComplete: boolean;
  verificationReady: boolean;
  operationalReady: boolean;
};

export type ProfileOnboardingPhase =
  | 'not_started'
  | 'in_progress'
  | 'verification_pending'
  | 'ready';

export type ProfileReadinessSnapshot = {
  completion: ProfileCompletionState;
  onboardingPhase: ProfileOnboardingPhase;
  verificationStatus: string | null;
  marketplaceReady: boolean;
  businessReady: boolean;
};
