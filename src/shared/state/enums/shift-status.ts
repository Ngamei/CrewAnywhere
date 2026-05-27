import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.shift_status` */
export const shiftStatusEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.shiftStatus}`,
  values: [
    'scheduled',
    'checked_in',
    'in_progress',
    'completed',
    'no_show',
    'cancelled',
  ] as const,
});

export const SHIFT_STATUSES = shiftStatusEnum.values;
export type ShiftStatus = PgEnumValue<typeof shiftStatusEnum>;
