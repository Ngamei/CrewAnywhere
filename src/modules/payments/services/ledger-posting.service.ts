import { AppError } from '@/shared/api/errors';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { LedgerRepository } from '@/modules/payments/repositories';
import type { FinanceTransactionInsert } from '@/modules/payments/types/finance-transaction-records';
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

export type PostedLedgerGroup = {
  ledgerEntryGroupId: string;
  transactionType: FinanceTransactionType;
  lines: Awaited<ReturnType<LedgerRepository['listByLedgerGroupId']>>;
};

/**
 * Immutable double-entry postings — never mutates balances or ledger rows.
 */
export class LedgerPostingService {
  constructor(private readonly context: AuthenticatedServiceContext) {}

  private getLedgerRepository() {
    return new LedgerRepository(createDomainRepositoryClients(this.context.supabase));
  }

  buildLedgerGroupId(): string {
    return crypto.randomUUID();
  }

  buildLineIdempotencyKey(baseKey: string, leg: 'debit' | 'credit', sequence: number): string {
    return `${baseKey}:${leg}:${sequence}`;
  }

  async isLedgerGroupBalanced(ledgerEntryGroupId: string): Promise<boolean> {
    const balance = await this.getLedgerRepository().sumPostedGroupBalance(ledgerEntryGroupId);
    return balance === '0.00';
  }

  async postBalancedPair(input: {
    context: LedgerPostingContext;
    transactionType: FinanceTransactionType;
    debitAccount: FinanceLedgerAccount;
    creditAccount: FinanceLedgerAccount;
    idempotencyBaseKey: string;
    ledgerEntryGroupId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PostedLedgerGroup> {
    const ledger = this.getLedgerRepository();
    const ledgerEntryGroupId = input.ledgerEntryGroupId ?? this.buildLedgerGroupId();
    const debitKey = this.buildLineIdempotencyKey(input.idempotencyBaseKey, 'debit', 1);
    const creditKey = this.buildLineIdempotencyKey(input.idempotencyBaseKey, 'credit', 2);

    const existingDebit = await ledger.findByIdempotencyKey(debitKey);
    if (existingDebit) {
      const lines = await ledger.listByLedgerGroupId(existingDebit.ledger_entry_group_id);
      return {
        ledgerEntryGroupId: existingDebit.ledger_entry_group_id,
        transactionType: input.transactionType,
        lines,
      };
    }

    const base: Omit<FinanceTransactionInsert, 'ledger_account' | 'direction' | 'entry_sequence' | 'idempotency_key'> = {
      ledger_entry_group_id: ledgerEntryGroupId,
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
        requestId: this.context.requestId,
        ...input.metadata,
      },
    };

    await ledger.insertEntry({
      ...base,
      entry_sequence: 1,
      ledger_account: input.debitAccount,
      direction: 'debit',
      idempotency_key: debitKey,
    });

    await ledger.insertEntry({
      ...base,
      entry_sequence: 2,
      ledger_account: input.creditAccount,
      direction: 'credit',
      idempotency_key: creditKey,
    });

    const balanced = await this.isLedgerGroupBalanced(ledgerEntryGroupId);
    if (!balanced) {
      throw new AppError(
        'LEDGER_GROUP_UNBALANCED',
        `Ledger group ${ledgerEntryGroupId} failed balance validation.`,
        422,
      );
    }

    const lines = await ledger.listByLedgerGroupId(ledgerEntryGroupId);
    return {
      ledgerEntryGroupId,
      transactionType: input.transactionType,
      lines,
    };
  }

  async postEscrowFunding(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'escrow_funding',
      debitAccount: 'business_cash',
      creditAccount: 'escrow',
      idempotencyBaseKey: `payment:${context.paymentId}:escrow_funding:${context.commandId}`,
    });
  }

  async postEscrowRelease(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'escrow_release',
      debitAccount: 'escrow',
      creditAccount: 'crew_wallet_pending',
      idempotencyBaseKey: `payment:${context.paymentId}:escrow_release:${context.commandId}`,
    });
  }

  async postWalletCredit(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'wallet_credit',
      debitAccount: 'crew_wallet_pending',
      creditAccount: 'crew_wallet_available',
      idempotencyBaseKey: `payment:${context.paymentId}:wallet_credit:${context.commandId}`,
    });
  }

  async postRefundFromEscrow(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'refund',
      debitAccount: 'escrow',
      creditAccount: 'business_cash',
      idempotencyBaseKey: `payment:${context.paymentId}:refund:${context.commandId}`,
    });
  }
}
