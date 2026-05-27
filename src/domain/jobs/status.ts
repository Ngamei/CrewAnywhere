export const JOB_STATUSES = [
  'draft',
  'open',
  'reviewing',
  'filled',
  'active',
  'completed',
  'closed',
  'expired',
  'cancelled',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ['open', 'closed', 'cancelled'],
  open: ['reviewing', 'filled', 'expired', 'closed', 'cancelled'],
  reviewing: ['open', 'filled', 'closed', 'cancelled'],
  filled: ['active', 'closed', 'cancelled'],
  active: ['completed', 'closed', 'cancelled'],
  completed: ['closed'],
  closed: [],
  expired: [],
  cancelled: [],
};
