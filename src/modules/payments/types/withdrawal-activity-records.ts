import type { FinanceTransactionRecord } from '@/modules/payments/types/finance-transaction-records';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';
import { buildTransactionActivityFromLedgerLines } from './transaction-activity-records';

/** Immutable withdrawal activity snapshot from posted ledger lines. */
export type WithdrawalActivityRecord = {
  id: string;
  ledgerEntryGroupId: string;
  transactionType: FinanceTransactionType;
  withdrawalRequestId: string;
  paymentId: string | null;
  crewUserId: string | null;
  amount: string;
  currency: string;
  commandId: string | null;
  requestId: string | null;
  postedAt: string;
  idempotencyKeys: string[];
  replayed: boolean;
};

export function buildWithdrawalActivityFromLedgerLines(
  lines: FinanceTransactionRecord[],
  options: { replayed?: boolean } = {},
): WithdrawalActivityRecord | null {
  const base = buildTransactionActivityFromLedgerLines(lines, options);
  if (!base) return null;

  const withdrawalRequestId = lines[0]?.withdrawal_request_id;
  if (!withdrawalRequestId) return null;

  return {
    ...base,
    withdrawalRequestId,
  };
}
