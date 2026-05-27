import type { JobRecord, JobSkillRecord } from './job-records';
import type { JobLifecycleContext, JobPublishingReadiness } from './job-workflow';

export type JobDto = JobRecord & {
  skills: JobSkillRecord[];
  readiness: JobPublishingReadiness;
  lifecycle: JobLifecycleContext;
};

export type JobListItemDto = Pick<
  JobRecord,
  'id' | 'event_id' | 'company_profile_id' | 'title' | 'status' | 'headcount' | 'rate_amount' | 'updated_at'
> & {
  requiredSkillCount: number;
};
