import type { ShiftStatus } from '@/shared/state/enums/shift-status';

/** Row shape for `public.shifts`. */
export type ShiftRecord = {
  id: string;
  assignment_id: string;
  event_id: string;
  job_id: string;
  company_profile_id: string;
  crew_user_id: string;
  supervisor_business_user_id: string | null;
  status: ShiftStatus;
  status_version: number;
  starts_at: string;
  ends_at: string;
  check_in_at: string | null;
  check_out_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
