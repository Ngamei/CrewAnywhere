import type { FinanceEntryDirection } from '@/shared/state/enums/finance-entry-direction';
import type { FinanceLedgerAccount } from '@/shared/state/enums/finance-ledger-account';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';

/** Row shape for `public.finance_transactions`. */
export type FinanceTransactionRecord = {
  id: string;
  ledger_entry_group_id: string;
  entry_sequence: number;
  payment_id: string | null;
  escrow_record_id: string | null;
  refund_id: string | null;
  withdrawal_request_id: string | null;
  company_profile_id: string | null;
  crew_user_id: string | null;
  ledger_account: FinanceLedgerAccount;
  direction: FinanceEntryDirection;
  transaction_type: FinanceTransactionType;
  status: 'posted' | 'pending' | 'failed' | 'reversed';
  amount: string;
  currency: string;
  idempotency_key: string;
  reversal_of_transaction_id: string | null;
  external_reference: string | null;
  metadata: Record<string, unknown>;
  posted_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type FinanceTransactionInsert = {
  ledger_entry_group_id: string;
  entry_sequence: number;
  payment_id?: string;
  escrow_record_id?: string;
  refund_id?: string;
  withdrawal_request_id?: string;
  company_profile_id?: string;
  crew_user_id?: string;
  ledger_account: FinanceLedgerAccount;
  direction: FinanceEntryDirection;
  transaction_type: FinanceTransactionType;
  amount: string;
  currency: string;
  idempotency_key: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
};
