import type { JobStatus } from '@/shared/state/enums/job-status';

export type JobCompensationStructure = {
  rateAmount: number | null;
  rateCurrency: string;
  headcount: number;
  hasCompensation: boolean;
};

export type JobScheduleStructure = {
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  scheduleConfigured: boolean;
};

export type JobStaffingRequirements = {
  headcount: number;
  requiredSkillCount: number;
  skills: { skillName: string; required: boolean }[];
};

export type JobPublishingReadiness = {
  publishReady: boolean;
  operationalReady: boolean;
  compensation: JobCompensationStructure;
  schedule: JobScheduleStructure;
  staffing: JobStaffingRequirements;
};

export type JobLifecycleContext = {
  status: JobStatus;
  allowedTransitions: readonly JobStatus[];
};
