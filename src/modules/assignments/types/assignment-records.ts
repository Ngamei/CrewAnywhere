import type { AssignmentStatus } from '@/shared/state/enums/assignment-status';

/** Row shape for `public.assignments`. */
export type AssignmentRecord = {
  id: string;
  proposal_id: string;
  job_id: string;
  event_id: string;
  company_profile_id: string;
  crew_user_id: string;
  status: AssignmentStatus;
  status_version: number;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  activated_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
