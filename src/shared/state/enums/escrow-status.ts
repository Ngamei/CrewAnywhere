import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.escrow_status` */
export const escrowStatusEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.escrowStatus}`,
  values: [
    'awaiting_funding',
    'funded',
    'partially_funded',
    'held',
    'released',
    'refunded',
    'disputed',
  ] as const,
});

export const ESCROW_STATUSES = escrowStatusEnum.values;
export type EscrowStatus = PgEnumValue<typeof escrowStatusEnum>;
