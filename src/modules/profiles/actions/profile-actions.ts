import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import {
  BusinessMembershipService,
  CompanyProfileService,
  CrewProfileService,
} from '@/modules/profiles/services';
import type {
  CreateCompanyProfileInput,
  CreateCrewProfileInput,
  UpdateBusinessMembershipInput,
  UpdateCompanyFinanceInput,
  UpdateCompanyProfileInput,
  UpdateCrewProfileInput,
  UpsertCrewExperienceInput,
  UpsertCrewSkillInput,
} from '@/modules/profiles/schemas';

/**
 * Orchestration-safe profile actions — idempotent reads, validated writes,
 * ownership enforced in services before service-role persistence.
 */

export async function listOwnedCompanyProfiles(context: AuthenticatedServiceContext) {
  return new CompanyProfileService(context).listOwnedCompanies();
}

export async function getCompanyProfile(
  context: AuthenticatedServiceContext,
  companyProfileId: string,
) {
  return new CompanyProfileService(context).getCompanyProfile(companyProfileId);
}

export async function createCompanyProfile(
  context: AuthenticatedServiceContext,
  input: CreateCompanyProfileInput,
) {
  return new CompanyProfileService(context).createCompanyProfile(input);
}

export async function updateCompanyProfile(
  context: AuthenticatedServiceContext,
  companyProfileId: string,
  input: UpdateCompanyProfileInput,
) {
  return new CompanyProfileService(context).updateCompanyProfile(companyProfileId, input);
}

export async function updateCompanyFinance(
  context: AuthenticatedServiceContext,
  companyProfileId: string,
  input: UpdateCompanyFinanceInput,
) {
  return new CompanyProfileService(context).updateCompanyFinance(companyProfileId, input);
}

export async function getCompanyProfileReadiness(
  context: AuthenticatedServiceContext,
  companyProfileId: string,
) {
  return new CompanyProfileService(context).getCompanyReadiness(companyProfileId);
}

export async function getMyCrewProfile(context: AuthenticatedServiceContext) {
  return new CrewProfileService(context).getMyCrewProfile();
}

export async function createCrewProfile(
  context: AuthenticatedServiceContext,
  input: CreateCrewProfileInput,
) {
  return new CrewProfileService(context).createCrewProfile(input);
}

export async function updateMyCrewProfile(
  context: AuthenticatedServiceContext,
  input: UpdateCrewProfileInput,
) {
  return new CrewProfileService(context).updateMyCrewProfile(input);
}

export async function addCrewSkill(
  context: AuthenticatedServiceContext,
  input: UpsertCrewSkillInput,
) {
  return new CrewProfileService(context).addSkill(input);
}

export async function removeCrewSkill(context: AuthenticatedServiceContext, skillId: string) {
  return new CrewProfileService(context).removeSkill(skillId);
}

export async function addCrewExperience(
  context: AuthenticatedServiceContext,
  input: UpsertCrewExperienceInput,
) {
  return new CrewProfileService(context).addExperience(input);
}

export async function removeCrewExperience(
  context: AuthenticatedServiceContext,
  experienceId: string,
) {
  return new CrewProfileService(context).removeExperience(experienceId);
}

export async function getCrewProfileReadiness(context: AuthenticatedServiceContext) {
  return new CrewProfileService(context).getCrewReadiness();
}

export async function getCurrentBusinessMembership(context: AuthenticatedServiceContext) {
  return new BusinessMembershipService(context).getCurrentMembership();
}

export async function updateCurrentBusinessMembership(
  context: AuthenticatedServiceContext,
  input: UpdateBusinessMembershipInput,
) {
  return new BusinessMembershipService(context).updateCurrentMembership(input);
}

export async function validateCompanyOwnership(
  context: AuthenticatedServiceContext,
  companyProfileId: string,
) {
  return new BusinessMembershipService(context).validateCompanyOwnership(companyProfileId);
}
