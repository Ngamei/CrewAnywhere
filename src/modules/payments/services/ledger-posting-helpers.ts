import type { FinanceTransactionInsert } from '@/modules/payments/types/finance-transaction-records';
import type { FinanceTransactionRecord } from '@/modules/payments/types/finance-transaction-records';
import type { FinanceLedgerAccount } from '@/shared/state/enums/finance-ledger-account';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';

export type LedgerPostingContext = {
  paymentId: string;
  escrowRecordId?: string;
  refundId?: string;
  companyProfileId: string;
  crewUserId: string;
  amount: string;
  currency: string;
  commandId: string;
};

export function buildLedgerGroupId(): string {
  return crypto.randomUUID();
}

export function buildLineIdempotencyKey(baseKey: string, leg: 'debit' | 'credit', sequence: number): string {
  return `${baseKey}:${leg}:${sequence}`;
}

export function sumPostedGroupBalance(lines: FinanceTransactionRecord[]): string {
  const posted = lines.filter((line) => line.status === 'posted');
  const balance = posted.reduce((sum, line) => {
    const amount = Number.parseFloat(line.amount);
    return sum + (line.direction === 'credit' ? amount : -amount);
  }, 0);
  return balance.toFixed(2);
}

export function isPostedGroupBalanced(lines: FinanceTransactionRecord[]): boolean {
  return sumPostedGroupBalance(lines) === '0.00';
}

export type BalancedPairInsertInput = {
  context: LedgerPostingContext;
  transactionType: FinanceTransactionType;
  debitAccount: FinanceLedgerAccount;
  creditAccount: FinanceLedgerAccount;
  idempotencyBaseKey: string;
  ledgerEntryGroupId: string;
  metadata?: Record<string, unknown>;
  requestId: string;
};

export function buildBalancedPairInserts(
  input: BalancedPairInsertInput,
): [FinanceTransactionInsert, FinanceTransactionInsert] {
  const debitKey = buildLineIdempotencyKey(input.idempotencyBaseKey, 'debit', 1);
  const creditKey = buildLineIdempotencyKey(input.idempotencyBaseKey, 'credit', 2);

  const base: Omit<FinanceTransactionInsert, 'ledger_account' | 'direction' | 'entry_sequence' | 'idempotency_key'> = {
    ledger_entry_group_id: input.ledgerEntryGroupId,
    payment_id: input.context.paymentId,
    escrow_record_id: input.context.escrowRecordId,
    refund_id: input.context.refundId,
    company_profile_id: input.context.companyProfileId,
    crew_user_id: input.context.crewUserId,
    transaction_type: input.transactionType,
    amount: input.context.amount,
    currency: input.context.currency,
    metadata: {
      commandId: input.context.commandId,
      requestId: input.requestId,
      ...input.metadata,
    },
  };

  return [
    {
      ...base,
      entry_sequence: 1,
      ledger_account: input.debitAccount,
      direction: 'debit',
      idempotency_key: debitKey,
    },
    {
      ...base,
      entry_sequence: 2,
      ledger_account: input.creditAccount,
      direction: 'credit',
      idempotency_key: creditKey,
    },
  ];
}

export function escrowFundingIdempotencyBase(paymentId: string, commandId: string): string {
  return `payment:${paymentId}:escrow_funding:${commandId}`;
}

export function escrowReleaseIdempotencyBase(paymentId: string, commandId: string): string {
  return `payment:${paymentId}:escrow_release:${commandId}`;
}

export function walletCreditIdempotencyBase(paymentId: string, commandId: string): string {
  return `payment:${paymentId}:wallet_credit:${commandId}`;
}

export function refundFromEscrowIdempotencyBase(paymentId: string, commandId: string): string {
  return `payment:${paymentId}:refund:${commandId}`;
}
