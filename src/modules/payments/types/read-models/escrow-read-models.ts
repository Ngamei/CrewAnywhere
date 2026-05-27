import type { EscrowStatus } from '@/shared/state/enums/escrow-status';
import type { EscrowRecord } from '../payment-records';

/** Operational escrow snapshot for UI — derived from `escrow_records`, not ledger balances. */
export type EscrowReadModel = Pick<
  EscrowRecord,
  'id' | 'payment_id' | 'status' | 'amount_held' | 'currency' | 'funded_at' | 'released_at'
> & {
  providerLabel: string | null;
  fundingComplete: boolean;
  releaseEligible: boolean;
};

export type EscrowTimelineEntry = {
  id: string;
  escrowId: string;
  fromStatus: EscrowStatus | null;
  toStatus: EscrowStatus;
  label: string;
  timestamp: string;
  source?: string;
};
