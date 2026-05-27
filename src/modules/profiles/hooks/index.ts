export {
  buildCompanyReadinessSnapshot,
  buildCrewReadinessSnapshot,
  computeCompanyProfileCompletion,
  computeCrewProfileCompletion,
  resolveOnboardingPhase,
} from './profile-completion';

export { profileQueryKeys } from './profile-query-keys';
export { useProfileReadiness } from './use-profile-readiness';

export {
  assertBusinessRoleCanManageCompany,
  assertCanAccessCrewMarketplace,
  assertCanManageCompany,
  assertCompanyProfileAccess,
  assertCrewProfileAccess,
} from './ownership-validation';
