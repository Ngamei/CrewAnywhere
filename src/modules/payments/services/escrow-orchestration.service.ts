import { AppError } from '@/shared/api/errors';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { PaymentRepository } from '@/modules/payments/repositories';
import type { EscrowRecord, PaymentRecord } from '@/modules/payments/types/payment-records';
import { LedgerPostingService, type LedgerPostingContext } from './ledger-posting.service';
import { EscrowFundingService, type EscrowFundingResult } from './escrow-funding.service';
import {
  EscrowReleaseService,
  type EscrowReleaseResult,
  type EscrowReleaseShiftContext,
} from './escrow-release.service';

export type { EscrowFundingResult, EscrowReleaseResult, EscrowReleaseShiftContext };

/**
 * Facade coordinating escrow funding and release services with refund ledger support.
 */
export class EscrowOrchestrationService {
  private readonly funding: EscrowFundingService;
  private readonly release: EscrowReleaseService;
  private readonly ledger: LedgerPostingService;

  constructor(private readonly context: AuthenticatedServiceContext) {
    this.funding = new EscrowFundingService(context);
    this.release = new EscrowReleaseService(context);
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

  ensureEscrowRecord(payment: PaymentRecord): Promise<EscrowRecord> {
    return this.funding.ensureEscrowRecord(payment);
  }

  fundEscrow(payment: PaymentRecord, commandId: string): Promise<EscrowFundingResult> {
    return this.funding.fundEscrow(payment, commandId);
  }

  releaseEscrowToWallet(
    payment: PaymentRecord,
    commandId: string,
    shiftContext?: EscrowReleaseShiftContext,
  ): Promise<EscrowReleaseResult> {
    return this.release.releaseEscrowToWallet(payment, commandId, shiftContext);
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
