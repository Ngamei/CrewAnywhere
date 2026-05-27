export const profileQueryKeys = {
  company: {
    all: ['profiles', 'company'] as const,
    detail: (companyProfileId: string) => ['profiles', 'company', companyProfileId] as const,
    readiness: (companyProfileId: string) =>
      ['profiles', 'company', companyProfileId, 'readiness'] as const,
    owned: (businessUserId: string) => ['profiles', 'company', 'owner', businessUserId] as const,
  },
  crew: {
    me: ['profiles', 'crew', 'me'] as const,
    readiness: ['profiles', 'crew', 'readiness'] as const,
    skills: (crewUserId: string) => ['profiles', 'crew', crewUserId, 'skills'] as const,
    experience: (crewUserId: string) => ['profiles', 'crew', crewUserId, 'experience'] as const,
  },
  membership: {
    current: ['profiles', 'membership', 'current'] as const,
  },
} as const;
