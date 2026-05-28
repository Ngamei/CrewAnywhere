export {
  buildCompanyReadinessSnapshot,
  buildCrewReadinessSnapshot,
  computeCompanyProfileCompletion,
  computeCrewProfileCompletion,
  resolveOnboardingPhase,
} from './profile-completion';

export { profileQueryKeys } from './profile-query-keys';
export { useProfileReadiness } from './use-profile-readiness';
export { useCrewProfile } from './use-crew-profile';
export { useCompanyProfile } from './use-company-profile';
export { useOwnedCompanyProfiles } from './use-owned-company-profiles';
export { useBusinessMembership } from './use-business-membership';
export { useProfileMutations } from './use-profile-mutations';

export {
  assertBusinessRoleCanManageCompany,
  assertCanAccessCrewMarketplace,
  assertCanManageCompany,
  assertCompanyProfileAccess,
  assertCrewProfileAccess,
} from './ownership-validation';
