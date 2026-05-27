import type { FinanceTransactionRecord } from '@/modules/payments/types/finance-transaction-records';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';

/** Immutable activity snapshot derived from posted `finance_transactions` lines. */
export type TransactionActivityRecord = {
  id: string;
  ledgerEntryGroupId: string;
  transactionType: FinanceTransactionType;
  paymentId: string | null;
  escrowRecordId: string | null;
  crewUserId: string | null;
  companyProfileId: string | null;
  amount: string;
  currency: string;
  commandId: string | null;
  requestId: string | null;
  postedAt: string;
  idempotencyKeys: string[];
  replayed: boolean;
};

export function buildTransactionActivityFromLedgerLines(
  lines: FinanceTransactionRecord[],
  options: { replayed?: boolean } = {},
): TransactionActivityRecord | null {
  if (lines.length === 0) return null;

  const head = lines[0];
  const metadata = (head.metadata ?? {}) as Record<string, unknown>;
  const creditLine = lines.find((line) => line.direction === 'credit') ?? head;

  return {
    id: head.ledger_entry_group_id,
    ledgerEntryGroupId: head.ledger_entry_group_id,
    transactionType: head.transaction_type,
    paymentId: head.payment_id,
    escrowRecordId: head.escrow_record_id,
    crewUserId: head.crew_user_id,
    companyProfileId: head.company_profile_id,
    amount: creditLine.amount,
    currency: creditLine.currency,
    commandId: typeof metadata.commandId === 'string' ? metadata.commandId : null,
    requestId: typeof metadata.requestId === 'string' ? metadata.requestId : null,
    postedAt: head.posted_at,
    idempotencyKeys: lines.map((line) => line.idempotency_key),
    replayed: options.replayed ?? false,
  };
}
