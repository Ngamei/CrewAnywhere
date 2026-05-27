import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.withdrawal_status` */
export const withdrawalStatusEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.withdrawalStatus}`,
  values: [
    'requested',
    'under_review',
    'approved',
    'processing',
    'paid',
    'rejected',
    'cancelled',
  ] as const,
});

export const WITHDRAWAL_STATUSES = withdrawalStatusEnum.values;
export type WithdrawalStatus = PgEnumValue<typeof withdrawalStatusEnum>;
