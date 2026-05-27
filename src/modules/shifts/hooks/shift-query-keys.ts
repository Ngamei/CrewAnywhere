export const shiftQueryKeys = {
  all: ['shifts'] as const,
  list: (filters: { assignmentId?: string; eventId?: string; crewUserId?: string } = {}) =>
    [
      'shifts',
      'list',
      filters.assignmentId ?? 'all',
      filters.eventId ?? 'all',
      filters.crewUserId ?? 'all',
    ] as const,
  detail: (shiftId: string) => ['shifts', shiftId] as const,
  timeline: (shiftId: string) => ['shifts', shiftId, 'timeline'] as const,
  activity: (shiftId: string) => ['shifts', shiftId, 'activity'] as const,
  byAssignment: (assignmentId: string) => ['shifts', 'assignment', assignmentId] as const,
} as const;
