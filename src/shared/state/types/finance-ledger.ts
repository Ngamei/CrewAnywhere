import type { FinanceEntryDirection } from '../enums/finance-entry-direction';
import type { FinanceLedgerAccount } from '../enums/finance-ledger-account';
import type { FinanceTransactionType } from '../enums/finance-transaction-type';

/** Minimal ledger line shape aligned with `public.finance_transactions`. */
export type FinanceLedgerEntry = {
  ledgerEntryGroupId: string;
  entrySequence: number;
  ledgerAccount: FinanceLedgerAccount;
  direction: FinanceEntryDirection;
  transactionType: FinanceTransactionType;
  amount: string;
  currency: string;
};

export type FinanceLedgerPair = {
  debit: FinanceLedgerEntry;
  credit: FinanceLedgerEntry;
};
