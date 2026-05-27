export const eventQueryKeys = {
  all: ['events'] as const,
  list: (companyProfileId?: string) => ['events', 'list', companyProfileId ?? 'all'] as const,
  detail: (eventId: string) => ['events', eventId] as const,
  readiness: (eventId: string) => ['events', eventId, 'readiness'] as const,
  jobs: (eventId: string) => ['events', eventId, 'jobs'] as const,
} as const;
