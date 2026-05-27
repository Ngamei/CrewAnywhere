import type { JobStatus } from '@/shared/state/enums/job-status';

/** Row shape for `public.jobs`. */
export type JobRecord = {
  id: string;
  event_id: string;
  company_profile_id: string;
  created_by_business_user_id: string;
  title: string;
  description: string | null;
  headcount: number;
  rate_amount: number | null;
  rate_currency: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Row shape for `public.job_skills`. */
export type JobSkillRecord = {
  id: string;
  job_id: string;
  skill_name: string;
  skill_category: string | null;
  required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
