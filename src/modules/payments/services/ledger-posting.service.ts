import { AppError } from '@/shared/api/errors';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { LedgerRepository } from '@/modules/payments/repositories';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';
import type { FinanceLedgerAccount } from '@/shared/state/enums/finance-ledger-account';
import {
  buildBalancedPairInserts,
  buildLedgerGroupId,
  escrowFundingIdempotencyBase,
  escrowReleaseIdempotencyBase,
  isPostedGroupBalanced,
  refundFromEscrowIdempotencyBase,
  walletCreditIdempotencyBase,
  type LedgerPostingContext,
} from './ledger-posting-helpers';

export type { LedgerPostingContext };

export type PostedLedgerGroup = {
  ledgerEntryGroupId: string;
  transactionType: FinanceTransactionType;
  lines: Awaited<ReturnType<LedgerRepository['listByLedgerGroupId']>>;
  replayed: boolean;
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
    return buildLedgerGroupId();
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
    const ledgerEntryGroupId = input.ledgerEntryGroupId ?? buildLedgerGroupId();
    const [debitInsert, creditInsert] = buildBalancedPairInserts({
      context: input.context,
      transactionType: input.transactionType,
      debitAccount: input.debitAccount,
      creditAccount: input.creditAccount,
      idempotencyBaseKey: input.idempotencyBaseKey,
      ledgerEntryGroupId,
      metadata: input.metadata,
      requestId: this.context.requestId,
    });

    const existingDebit = await ledger.findByIdempotencyKey(debitInsert.idempotency_key);
    if (existingDebit) {
      const lines = await ledger.listByLedgerGroupId(existingDebit.ledger_entry_group_id);
      return {
        ledgerEntryGroupId: existingDebit.ledger_entry_group_id,
        transactionType: input.transactionType,
        lines,
        replayed: true,
      };
    }

    await ledger.insertEntry(debitInsert);
    await ledger.insertEntry(creditInsert);

    const lines = await ledger.listByLedgerGroupId(ledgerEntryGroupId);
    if (!isPostedGroupBalanced(lines)) {
      throw new AppError(
        'LEDGER_GROUP_UNBALANCED',
        `Ledger group ${ledgerEntryGroupId} failed balance validation.`,
        422,
      );
    }

    return {
      ledgerEntryGroupId,
      transactionType: input.transactionType,
      lines,
      replayed: false,
    };
  }

  async postEscrowFunding(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'escrow_funding',
      debitAccount: 'business_cash',
      creditAccount: 'escrow',
      idempotencyBaseKey: escrowFundingIdempotencyBase(context.paymentId, context.commandId),
    });
  }

  async postEscrowRelease(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'escrow_release',
      debitAccount: 'escrow',
      creditAccount: 'crew_wallet_pending',
      idempotencyBaseKey: escrowReleaseIdempotencyBase(context.paymentId, context.commandId),
    });
  }

  async postWalletCredit(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'wallet_credit',
      debitAccount: 'crew_wallet_pending',
      creditAccount: 'crew_wallet_available',
      idempotencyBaseKey: walletCreditIdempotencyBase(context.paymentId, context.commandId),
    });
  }

  async postRefundFromEscrow(context: LedgerPostingContext): Promise<PostedLedgerGroup> {
    return this.postBalancedPair({
      context,
      transactionType: 'refund',
      debitAccount: 'escrow',
      creditAccount: 'business_cash',
      idempotencyBaseKey: refundFromEscrowIdempotencyBase(context.paymentId, context.commandId),
    });
  }
}
