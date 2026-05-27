import { AppError } from '@/shared/api/errors';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { AssignmentRepository } from '@/modules/assignments/repositories';
import { ShiftRepository } from '@/modules/shifts/repositories';
import { LedgerRepository, PaymentRepository } from '@/modules/payments/repositories';
import type { TransactionActivityRecord } from '@/modules/payments/types/transaction-activity-records';
import { buildTransactionActivityFromLedgerLines } from '@/modules/payments/types/transaction-activity-records';
import type { EscrowRecord, PaymentRecord } from '@/modules/payments/types/payment-records';
import { LedgerPostingService, type LedgerPostingContext } from './ledger-posting.service';
import { assertWorkflowLedgerSynchronized, loadPaymentLedgerLines } from './workflow-ledger-sync';

export type EscrowReleaseResult = {
  payment: PaymentRecord;
  escrow: EscrowRecord;
  releaseLedgerGroupId: string;
  walletCreditLedgerGroupId: string;
  releaseActivity: TransactionActivityRecord;
  walletCreditActivity: TransactionActivityRecord;
};

export type EscrowReleaseShiftContext = {
  shiftId: string;
  shiftCompleted?: boolean;
  attendanceValidated?: boolean;
};

/**
 * Releases escrow to crew wallet pending, then credits available balance via ledger groups only.
 */
export class EscrowReleaseService {
  private readonly ledger: LedgerPostingService;

  constructor(private readonly context: AuthenticatedServiceContext) {
    this.ledger = new LedgerPostingService(context);
  }

  private getPaymentRepository() {
    return new PaymentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getAssignmentRepository() {
    return new AssignmentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getShiftRepository() {
    return new ShiftRepository(createDomainRepositoryClients(this.context.supabase));
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

  async assertShiftReleaseEligible(
    payment: PaymentRecord,
    shiftContext: EscrowReleaseShiftContext,
  ): Promise<void> {
    const assignment = await this.getAssignmentRepository().findById(payment.assignment_id);
    if (!assignment) {
      throw new AppError('ASSIGNMENT_NOT_FOUND', 'Assignment is required for escrow release.', 422);
    }

    const shift = await this.getShiftRepository().findById(shiftContext.shiftId);
    if (!shift || shift.assignment_id !== payment.assignment_id) {
      throw new AppError('SHIFT_NOT_FOUND', 'Shift does not belong to payment assignment.', 422);
    }

    const shiftCompleted = shiftContext.shiftCompleted ?? shift.status === 'completed';
    if (!shiftCompleted) {
      throw new AppError('SHIFT_NOT_COMPLETED', 'Shift must be completed before payment release.', 422);
    }

    const attendanceValidated =
      shiftContext.attendanceValidated ??
      (shift.check_in_at != null && shift.check_out_at != null);

    if (!attendanceValidated) {
      throw new AppError(
        'ATTENDANCE_NOT_VALIDATED',
        'Shift attendance must be validated before escrow release.',
        422,
      );
    }
  }

  async releaseEscrowToWallet(
    payment: PaymentRecord,
    commandId: string,
    shiftContext?: EscrowReleaseShiftContext,
  ): Promise<EscrowReleaseResult> {
    if (payment.status !== 'funded') {
      throw new AppError('PAYMENT_NOT_FUNDED', 'Payment must be funded before release.', 422);
    }

    if (shiftContext) {
      await this.assertShiftReleaseEligible(payment, shiftContext);
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

    const releaseActivity = buildTransactionActivityFromLedgerLines(releasePosted.lines, {
      replayed: releasePosted.replayed,
    });
    const walletCreditActivity = buildTransactionActivityFromLedgerLines(walletPosted.lines, {
      replayed: walletPosted.replayed,
    });

    if (!releaseActivity || !walletCreditActivity) {
      throw new AppError('LEDGER_ACTIVITY_MISSING', 'Escrow release did not produce ledger activity.', 422);
    }

    const releasedAt = new Date().toISOString();
    const updatedEscrow = await repo.updateEscrowStatus(escrow.id, 'released', {
      releasedAt,
    });

    const ledgerRepo = new LedgerRepository(createDomainRepositoryClients(this.context.supabase));
    const ledgerLines = await loadPaymentLedgerLines(ledgerRepo, payment.id);
    assertWorkflowLedgerSynchronized({
      paymentId: payment.id,
      paymentStatus: payment.status,
      escrowStatus: updatedEscrow.status,
      ledgerLines,
      expectedTransactionTypes: ['escrow_funding', 'escrow_release', 'wallet_credit'],
    });

    publishStaffingDomainEvent(
      'payments.payment_released',
      payment.id,
      {
        assignmentId: payment.assignment_id,
        releaseLedgerGroupId: releasePosted.ledgerEntryGroupId,
        shiftId: shiftContext?.shiftId,
        commandId,
      },
      this.context.requestId,
    );

    publishStaffingDomainEvent(
      'payments.wallet_credited',
      payment.id,
      {
        crewUserId: payment.crew_user_id,
        walletCreditLedgerGroupId: walletPosted.ledgerEntryGroupId,
        amount: payment.amount,
        currency: payment.currency,
        commandId,
      },
      this.context.requestId,
    );

    return {
      payment,
      escrow: updatedEscrow,
      releaseLedgerGroupId: releasePosted.ledgerEntryGroupId,
      walletCreditLedgerGroupId: walletPosted.ledgerEntryGroupId,
      releaseActivity,
      walletCreditActivity,
    };
  }
}
