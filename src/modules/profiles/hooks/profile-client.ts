import { fetchApi } from '@/shared/api/client';
import type {
  CompanyProfileDto,
  CompanyProfileListItemDto,
  CrewProfileDto,
  BusinessMembershipDto,
} from '@/modules/profiles/types';
import type { ProfileReadinessSnapshot } from '@/modules/profiles/types/profile-workflow';
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
import type { CrewExperienceDto, CrewSkillDto } from '@/modules/profiles/types';

const withCredentials: RequestInit = { credentials: 'include' };

export async function fetchMyCrewProfile(): Promise<CrewProfileDto> {
  return fetchApi<CrewProfileDto>('/api/v1/crew-profiles', withCredentials);
}

export async function createMyCrewProfile(input: CreateCrewProfileInput): Promise<CrewProfileDto> {
  return fetchApi<CrewProfileDto>('/api/v1/crew-profiles', {
    ...withCredentials,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMyCrewProfile(input: UpdateCrewProfileInput): Promise<CrewProfileDto> {
  return fetchApi<CrewProfileDto>('/api/v1/crew-profiles', {
    ...withCredentials,
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function fetchCrewReadiness(): Promise<ProfileReadinessSnapshot> {
  return fetchApi<ProfileReadinessSnapshot>('/api/v1/crew-profiles/readiness', withCredentials);
}

export async function addCrewSkill(input: UpsertCrewSkillInput): Promise<CrewSkillDto> {
  return fetchApi<CrewSkillDto>('/api/v1/crew-profiles/skills', {
    ...withCredentials,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeCrewSkill(skillId: string): Promise<void> {
  await fetchApi<null>(`/api/v1/crew-profiles/skills/${skillId}`, {
    ...withCredentials,
    method: 'DELETE',
  });
}

export async function addCrewExperience(input: UpsertCrewExperienceInput): Promise<CrewExperienceDto> {
  return fetchApi<CrewExperienceDto>('/api/v1/crew-profiles/experience', {
    ...withCredentials,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeCrewExperience(experienceId: string): Promise<void> {
  await fetchApi<null>(`/api/v1/crew-profiles/experience/${experienceId}`, {
    ...withCredentials,
    method: 'DELETE',
  });
}

export async function fetchOwnedCompanyProfiles(): Promise<CompanyProfileListItemDto[]> {
  return fetchApi<CompanyProfileListItemDto[]>('/api/v1/company-profiles', withCredentials);
}

export async function fetchCompanyProfile(companyProfileId: string): Promise<CompanyProfileDto> {
  return fetchApi<CompanyProfileDto>(`/api/v1/company-profiles/${companyProfileId}`, withCredentials);
}

export async function createCompanyProfile(input: CreateCompanyProfileInput): Promise<CompanyProfileDto> {
  return fetchApi<CompanyProfileDto>('/api/v1/company-profiles', {
    ...withCredentials,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCompanyProfile(
  companyProfileId: string,
  input: UpdateCompanyProfileInput,
): Promise<CompanyProfileDto> {
  return fetchApi<CompanyProfileDto>(`/api/v1/company-profiles/${companyProfileId}`, {
    ...withCredentials,
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function updateCompanyFinance(
  companyProfileId: string,
  input: UpdateCompanyFinanceInput,
): Promise<CompanyProfileDto> {
  return fetchApi<CompanyProfileDto>(`/api/v1/company-profiles/${companyProfileId}/finance`, {
    ...withCredentials,
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function fetchCompanyReadiness(companyProfileId: string): Promise<ProfileReadinessSnapshot> {
  return fetchApi<ProfileReadinessSnapshot>(
    `/api/v1/company-profiles/${companyProfileId}/readiness`,
    withCredentials,
  );
}

export async function fetchBusinessMembership(): Promise<BusinessMembershipDto> {
  return fetchApi<BusinessMembershipDto>('/api/v1/business-membership', withCredentials);
}

export async function updateBusinessMembership(
  input: UpdateBusinessMembershipInput,
): Promise<BusinessMembershipDto> {
  return fetchApi<BusinessMembershipDto>('/api/v1/business-membership', {
    ...withCredentials,
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
