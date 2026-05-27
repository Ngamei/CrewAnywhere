export const ACCOUNT_STATUSES = ['pending_verification', 'active', 'suspended', 'deleted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  'submitted',
  'approved',
  'additional_info_requested',
  'rejected',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ACCOUNT_STATUS_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  pending_verification: ['active'],
  active: ['suspended', 'deleted'],
  suspended: ['active', 'deleted'],
  deleted: [],
};
