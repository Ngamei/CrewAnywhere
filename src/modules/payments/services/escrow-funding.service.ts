import { AppError } from '@/shared/api/errors';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { LedgerRepository, PaymentRepository } from '@/modules/payments/repositories';
import type { TransactionActivityRecord } from '@/modules/payments/types/transaction-activity-records';
import { buildTransactionActivityFromLedgerLines } from '@/modules/payments/types/transaction-activity-records';
import type { EscrowRecord, PaymentRecord } from '@/modules/payments/types/payment-records';
import { LedgerPostingService, type LedgerPostingContext } from './ledger-posting.service';
import { assertWorkflowLedgerSynchronized, loadPaymentLedgerLines } from './workflow-ledger-sync';

export type EscrowFundingResult = {
  payment: PaymentRecord;
  escrow: EscrowRecord;
  ledgerGroupId: string;
  activity: TransactionActivityRecord;
};

/**
 * Posts escrow funding ledger entries and advances escrow workflow state.
 * Balances are derived only from immutable `finance_transactions` rows.
 */
export class EscrowFundingService {
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
  ): LedgerPostingContext {
    return {
      paymentId: payment.id,
      escrowRecordId: escrow.id,
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
    const activity = buildTransactionActivityFromLedgerLines(posted.lines, {
      replayed: posted.replayed,
    });

    if (!activity) {
      throw new AppError('LEDGER_ACTIVITY_MISSING', 'Escrow funding did not produce ledger activity.', 422);
    }

    const fundedAt = new Date().toISOString();
    const updatedEscrow = await repo.updateEscrowStatus(escrow.id, 'funded', {
      amountHeld: payment.amount,
      fundedAt,
    });

    const ledgerRepo = new LedgerRepository(createDomainRepositoryClients(this.context.supabase));
    const ledgerLines = await loadPaymentLedgerLines(ledgerRepo, payment.id);
    assertWorkflowLedgerSynchronized({
      paymentId: payment.id,
      paymentStatus: payment.status,
      escrowStatus: updatedEscrow.status,
      ledgerLines,
      expectedTransactionTypes: ['escrow_funding'],
    });

    publishStaffingDomainEvent(
      'payments.escrow_funded',
      payment.id,
      {
        assignmentId: payment.assignment_id,
        escrowRecordId: updatedEscrow.id,
        ledgerEntryGroupId: posted.ledgerEntryGroupId,
        commandId,
      },
      this.context.requestId,
    );

    return {
      payment,
      escrow: updatedEscrow,
      ledgerGroupId: posted.ledgerEntryGroupId,
      activity,
    };
  }
}
