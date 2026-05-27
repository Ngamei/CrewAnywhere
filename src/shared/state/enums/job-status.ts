import { definePgEnum, type PgEnumValue } from './define-pg-enum';

/** @see schema.sql — `public.job_status` */
export const jobStatusEnum = definePgEnum({
  pgType: 'public.job_status',
  values: [
    'draft',
    'open',
    'reviewing',
    'filled',
    'active',
    'completed',
    'closed',
    'expired',
    'cancelled',
  ] as const,
});

export const JOB_STATUSES = jobStatusEnum.values;
export type JobStatus = PgEnumValue<typeof jobStatusEnum>;
