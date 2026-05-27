import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.assignment_status` */
export const assignmentStatusEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.assignmentStatus}`,
  values: ['scheduled', 'active', 'completed', 'cancelled'] as const,
});

export const ASSIGNMENT_STATUSES = assignmentStatusEnum.values;
export type AssignmentStatus = PgEnumValue<typeof assignmentStatusEnum>;
