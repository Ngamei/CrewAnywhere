export const PAYMENT_FUNDING_STATUSES = ['awaiting_funding', 'funded', 'partially_funded', 'failed_funding'] as const;
export type PaymentFundingStatus = (typeof PAYMENT_FUNDING_STATUSES)[number];

export const PAYMENT_RELEASE_STATUSES = ['pending_release', 'released', 'refunded'] as const;
export type PaymentReleaseStatus = (typeof PAYMENT_RELEASE_STATUSES)[number];
