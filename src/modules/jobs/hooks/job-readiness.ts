import type { EventRecord } from '@/modules/events/types/event-records';
import type { JobRecord, JobSkillRecord } from '@/modules/jobs/types/job-records';
import type {
  JobCompensationStructure,
  JobPublishingReadiness,
  JobScheduleStructure,
  JobStaffingRequirements,
} from '@/modules/jobs/types/job-workflow';

export function buildJobCompensation(job: JobRecord): JobCompensationStructure {
  return {
    rateAmount: job.rate_amount,
    rateCurrency: job.rate_currency,
    headcount: job.headcount,
    hasCompensation: job.rate_amount != null && job.rate_amount > 0,
  };
}

export function buildJobSchedule(event: Pick<EventRecord, 'starts_at' | 'ends_at'>): JobScheduleStructure {
  return {
    eventStartsAt: event.starts_at,
    eventEndsAt: event.ends_at,
    scheduleConfigured: Boolean(event.starts_at && event.ends_at),
  };
}

export function buildJobStaffingRequirements(
  job: JobRecord,
  skills: JobSkillRecord[],
): JobStaffingRequirements {
  return {
    headcount: job.headcount,
    requiredSkillCount: skills.filter((s) => s.required).length,
    skills: skills.map((s) => ({ skillName: s.skill_name, required: s.required })),
  };
}

export function evaluateJobPublishingReadiness(
  job: JobRecord,
  skills: JobSkillRecord[],
  event: Pick<EventRecord, 'starts_at' | 'ends_at' | 'status'>,
): JobPublishingReadiness {
  const compensation = buildJobCompensation(job);
  const schedule = buildJobSchedule(event);
  const staffing = buildJobStaffingRequirements(job, skills);

  const publishReady =
    Boolean(job.title?.trim()) &&
    compensation.hasCompensation &&
    staffing.requiredSkillCount > 0 &&
    schedule.scheduleConfigured &&
    event.status === 'open';

  const operationalReady = publishReady && job.status === 'open';

  return {
    publishReady,
    operationalReady,
    compensation,
    schedule,
    staffing,
  };
}
