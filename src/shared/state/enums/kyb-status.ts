/**
 * KYB workflow statuses — persisted as `public.verification_status` on `kyb_records`.
 * Values are identical to verification_status; this module names the KYB domain explicitly.
 */
export {
  verificationStatusEnum as kybStatusEnum,
  VERIFICATION_STATUSES as KYB_STATUSES,
  type VerificationStatus as KybStatus,
} from './verification-status';
