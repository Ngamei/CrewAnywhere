import type { WithdrawalStatus } from '@/shared/state/enums/withdrawal-status';

/** Operational payout/withdrawal status for crew-facing displays. */
export type PayoutStatusDisplay = {
  withdrawalId: string;
  paymentId: string;
  status: WithdrawalStatus;
  operationalLabel: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'active' | 'pending';
  amount: string;
  currency: string;
  requestedAt: string;
  processedAt: string | null;
  payoutMethodLabel: string | null;
  isTerminal: boolean;
};
