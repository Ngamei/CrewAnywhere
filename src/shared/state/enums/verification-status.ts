import { definePgEnum, type PgEnumValue } from './define-pg-enum';
import { PG_ENUM_NAMES } from './pg-enum-names';

/**
 * Shared verification lifecycle stored as `public.verification_status`.
 * Used by KYB records, KYC records, and email verification tables.
 *
 * @see schema.sql — `public.verification_status`
 */
export const verificationStatusEnum = definePgEnum({
  pgType: `public.${PG_ENUM_NAMES.verificationStatus}`,
  values: [
    'pending',
    'submitted',
    'approved',
    'additional_info_requested',
    'rejected',
    'expired',
    'revoked',
  ] as const,
});

export const VERIFICATION_STATUSES = verificationStatusEnum.values;
export type VerificationStatus = PgEnumValue<typeof verificationStatusEnum>;
