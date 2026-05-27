import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/** @see schema.sql — `public.payment_status` */
export const paymentStatusEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.paymentStatus}`,
  values: [
    'pending',
    'authorized',
    'funded',
    'released',
    'refunded',
    'failed',
    'cancelled',
  ] as const,
});

export const PAYMENT_STATUSES = paymentStatusEnum.values;
export type PaymentStatus = PgEnumValue<typeof paymentStatusEnum>;
