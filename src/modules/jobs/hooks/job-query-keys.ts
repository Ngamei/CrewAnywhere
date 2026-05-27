export const jobQueryKeys = {
  all: ['jobs'] as const,
  list: (filters: { eventId?: string; companyProfileId?: string }) =>
    ['jobs', 'list', filters.eventId ?? 'all', filters.companyProfileId ?? 'all'] as const,
  detail: (jobId: string) => ['jobs', jobId] as const,
  readiness: (jobId: string) => ['jobs', jobId, 'readiness'] as const,
  skills: (jobId: string) => ['jobs', jobId, 'skills'] as const,
} as const;
