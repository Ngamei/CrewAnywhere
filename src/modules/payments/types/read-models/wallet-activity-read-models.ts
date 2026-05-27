import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';

/** Wallet activity feed item — derived from ledger + withdrawal workflow, replay-safe. */
export type WalletActivityFeedItem = {
  id: string;
  crewUserId: string;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  direction: 'credit' | 'debit';
  transactionType: FinanceTransactionType;
  timestamp: string;
  paymentId: string | null;
  withdrawalRequestId: string | null;
  ledgerEntryGroupId: string;
};
