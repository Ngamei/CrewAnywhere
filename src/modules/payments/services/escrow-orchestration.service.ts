import { AppError } from '@/shared/api/errors';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { PaymentRepository } from '@/modules/payments/repositories';
import type { EscrowRecord, PaymentRecord } from '@/modules/payments/types/payment-records';
import { LedgerPostingService, type LedgerPostingContext } from './ledger-posting.service';

export type EscrowFundingResult = {
  payment: PaymentRecord;
  escrow: EscrowRecord;
  ledgerGroupId: string;
};

export type EscrowReleaseResult = {
  payment: PaymentRecord;
  escrow: EscrowRecord;
  releaseLedgerGroupId: string;
  walletCreditLedgerGroupId: string;
};

/**
 * Coordinates escrow row state with immutable ledger postings.
 */
export class EscrowOrchestrationService {
  private readonly ledger: LedgerPostingService;

  constructor(private readonly context: AuthenticatedServiceContext) {
    this.ledger = new LedgerPostingService(context);
  }

  private getPaymentRepository() {
    return new PaymentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private postingContext(
    payment: PaymentRecord,
    escrow: EscrowRecord,
    commandId: string,
    refundId?: string,
  ): LedgerPostingContext {
    return {
      paymentId: payment.id,
      escrowRecordId: escrow.id,
      refundId,
      companyProfileId: payment.company_profile_id,
      crewUserId: payment.crew_user_id,
      amount: payment.amount,
      currency: payment.currency,
      commandId,
    };
  }

  async ensureEscrowRecord(payment: PaymentRecord): Promise<EscrowRecord> {
    const repo = this.getPaymentRepository();
    const existing = await repo.findEscrowByPaymentId(payment.id);
    if (existing) return existing;

    return repo.insertEscrow({
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    });
  }

  async fundEscrow(payment: PaymentRecord, commandId: string): Promise<EscrowFundingResult> {
    if (payment.status !== 'authorized') {
      throw new AppError('PAYMENT_NOT_AUTHORIZED', 'Payment must be authorized before escrow funding.', 422);
    }

    const repo = this.getPaymentRepository();
    const escrow = await this.ensureEscrowRecord(payment);
    const ctx = this.postingContext(payment, escrow, commandId);

    const posted = await this.ledger.postEscrowFunding(ctx);
    const fundedAt = new Date().toISOString();

    const updatedEscrow = await repo.updateEscrowStatus(escrow.id, 'funded', {
      amountHeld: payment.amount,
      fundedAt,
    });

    return {
      payment,
      escrow: updatedEscrow,
      ledgerGroupId: posted.ledgerEntryGroupId,
    };
  }

  async releaseEscrowToWallet(payment: PaymentRecord, commandId: string): Promise<EscrowReleaseResult> {
    if (payment.status !== 'funded') {
      throw new AppError('PAYMENT_NOT_FUNDED', 'Payment must be funded before release.', 422);
    }

    const repo = this.getPaymentRepository();
    const escrow = await repo.findEscrowByPaymentId(payment.id);
    if (!escrow) {
      throw new AppError('ESCROW_NOT_FOUND', 'Escrow record is required for payment release.', 422);
    }

    if (escrow.status !== 'funded' && escrow.status !== 'held') {
      throw new AppError('ESCROW_NOT_FUNDED', 'Escrow must be funded before release.', 422);
    }

    await repo.ensureCrewWallet(payment.crew_user_id, payment.currency);

    const ctx = this.postingContext(payment, escrow, commandId);
    const releasePosted = await this.ledger.postEscrowRelease(ctx);
    const walletPosted = await this.ledger.postWalletCredit(ctx);

    const releasedAt = new Date().toISOString();
    const updatedEscrow = await repo.updateEscrowStatus(escrow.id, 'released', {
      releasedAt,
    });

    return {
      payment,
      escrow: updatedEscrow,
      releaseLedgerGroupId: releasePosted.ledgerEntryGroupId,
      walletCreditLedgerGroupId: walletPosted.ledgerEntryGroupId,
    };
  }

  async createRefundLedger(
    payment: PaymentRecord,
    refundId: string,
    commandId: string,
  ): Promise<{ ledgerGroupId: string }> {
    const repo = this.getPaymentRepository();
    const escrow = await repo.findEscrowByPaymentId(payment.id);
    if (!escrow) {
      throw new AppError('ESCROW_NOT_FOUND', 'Escrow record is required for refund.', 422);
    }

    const ctx = this.postingContext(payment, escrow, commandId, refundId);
    const posted = await this.ledger.postRefundFromEscrow(ctx);
    await repo.updateEscrowStatus(escrow.id, 'refunded');

    return { ledgerGroupId: posted.ledgerEntryGroupId };
  }
}
