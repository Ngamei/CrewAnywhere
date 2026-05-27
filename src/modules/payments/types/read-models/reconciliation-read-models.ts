import type { PaymentStatus } from '@/shared/state/enums/payment-status';

/** Operational reconciliation slice — compares workflow state vs ledger-derived signals. */
export type ReconciliationViewDto = {
  paymentId: string;
  assignmentId: string;
  paymentStatus: PaymentStatus;
  escrowAmountHeld: string | null;
  ledgerPostedGroupCount: number;
  lastLedgerPostedAt: string | null;
  flags: ReconciliationFlag[];
};

export type ReconciliationFlag =
  | 'payment_funded_escrow_mismatch'
  | 'released_without_ledger_release'
  | 'withdrawal_pending_ledger_reservation'
  | 'stale_workflow_status'
  | 'balanced';
