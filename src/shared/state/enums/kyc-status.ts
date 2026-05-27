/**
 * KYC workflow statuses — persisted as `public.verification_status` on `kyc_records`.
 * Values are identical to verification_status; this module names the KYC domain explicitly.
 */
export {
  verificationStatusEnum as kycStatusEnum,
  VERIFICATION_STATUSES as KYC_STATUSES,
  type VerificationStatus as KycStatus,
} from './verification-status';
