import { JOB_STATUS_TRANSITIONS, type JobStatus } from '@/domain/jobs/status';

export const JOB_LIFECYCLE_TRANSITIONS = {
  publish: { from: 'draft' as const, to: 'open' as const, name: 'publish_job' },
  startReview: { from: 'open' as const, to: 'reviewing' as const, name: 'start_job_review' },
  markFilled: { from: 'open' as const, to: 'filled' as const, name: 'mark_job_filled' },
  activate: { from: 'filled' as const, to: 'active' as const, name: 'activate_job' },
  complete: { from: 'active' as const, to: 'completed' as const, name: 'complete_job' },
  close: { from: 'completed' as const, to: 'closed' as const, name: 'close_job' },
  expire: { from: 'open' as const, to: 'expired' as const, name: 'expire_job' },
  cancel: { from: 'draft' as const, to: 'cancelled' as const, name: 'cancel_job' },
} as const;

export function canTransitionJobLifecycle(from: JobStatus, to: JobStatus) {
  return JOB_STATUS_TRANSITIONS[from].includes(to);
}

export function assertJobLifecycleTransition(from: JobStatus, to: JobStatus) {
  if (!canTransitionJobLifecycle(from, to)) {
    throw new Error(`Invalid job status transition: ${from} -> ${to}`);
  }
}

export function getAllowedJobTransitions(from: JobStatus): readonly JobStatus[] {
  return JOB_STATUS_TRANSITIONS[from];
}
