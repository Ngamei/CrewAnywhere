import type { FinanceEntryDirection } from '@/shared/state/enums/finance-entry-direction';
import type { FinanceLedgerAccount } from '@/shared/state/enums/finance-ledger-account';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';

/** Read-only ledger line for operational history — mirrors `finance_transactions` without write surface. */
export type FinanceTransactionHistoryLine = {
  id: string;
  ledgerEntryGroupId: string;
  entrySequence: number;
  paymentId: string | null;
  escrowRecordId: string | null;
  withdrawalRequestId: string | null;
  ledgerAccount: FinanceLedgerAccount;
  direction: FinanceEntryDirection;
  transactionType: FinanceTransactionType;
  amount: string;
  currency: string;
  postedAt: string;
  externalReference: string | null;
};

/** Grouped ledger movement for timeline displays. */
export type LedgerGroupTimelineDto = {
  ledgerEntryGroupId: string;
  transactionType: FinanceTransactionType;
  currency: string;
  netAmount: string;
  postedAt: string;
  lines: FinanceTransactionHistoryLine[];
  paymentId: string | null;
  withdrawalRequestId: string | null;
};

/** Single row in payment/assignment transaction history tables. */
export type TransactionHistoryItemDto = {
  id: string;
  label: string;
  transactionType: FinanceTransactionType;
  amount: string;
  currency: string;
  direction: FinanceEntryDirection;
  postedAt: string;
  ledgerEntryGroupId: string;
};
