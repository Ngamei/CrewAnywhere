import {
  WorkflowTransitionExecutor,
  buildIdempotencyKey,
  evaluatePaymentGuards,
} from '@/backend/services/workflow';
import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import {
  getTransitionedByAuthAccountId,
  resolveWorkflowTransitionSource,
} from '@/backend/auth/authorization';
import { AppError, ConflictError, NotFoundError } from '@/shared/api/errors';
import { assertBusinessUser } from '@/shared/auth/guards';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { assertEventCompanyAccess } from '@/modules/events/hooks';
import { AssignmentRepository } from '@/modules/assignments/repositories';
import { ProposalRepository } from '@/modules/proposals/repositories';
import { ShiftRepository } from '@/modules/shifts/repositories';
import { PaymentRepository } from '@/modules/payments/repositories';
import type { PaymentDto } from '@/modules/payments/types';
import type { PaymentRecord } from '@/modules/payments/types/payment-records';
import { paymentWorkflowMachine } from '@/shared/state/workflows/payment-lifecycle';
import type { PaymentTransitionName } from '@/shared/state/workflows/payment-lifecycle';
import type { PaymentStatus } from '@/shared/state/enums/payment-status';
import { EscrowOrchestrationService } from './escrow-orchestration.service';
type PaymentTransitionOptions = {
  reason: string;
  idempotencyKey?: string;
  shiftCompleted?: boolean;
  attendanceValidated?: boolean;
  refundApproved?: boolean;
};

export type PayoutPreparationResult = {
  crewUserId: string;
  currency: string;
  requestedAmount: string;
  availableBalance: string;
  canPayout: boolean;
  detail?: string;
};

export class PaymentService extends AuthenticatedBaseService {
  private readonly executor = new WorkflowTransitionExecutor();

  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getPaymentRepository() {
    return new PaymentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getAssignmentRepository() {
    return new AssignmentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getProposalRepository() {
    return new ProposalRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getShiftRepository() {
    return new ShiftRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getEscrowOrchestration() {
    return new EscrowOrchestrationService(this.context);
  }

  private resolveTransitionName(from: PaymentStatus | null, to: PaymentStatus): PaymentTransitionName {
    const transition = paymentWorkflowMachine.getTransition(from, to);
    if (!transition) {
      throw new AppError('INVALID_TRANSITION', `No workflow transition from ${from} to ${to}`, 422);
    }
    return transition.name;
  }

  private transitionGuardKeys(transitionName: PaymentTransitionName): readonly string[] {
    return paymentWorkflowMachine.getTransitionByName(transitionName)?.metadata.guardKeys ?? [];
  }

  private async toDto(
    payment: PaymentRecord,
    lastTransition: WorkflowTransitionEventRecord | null = null,
  ): Promise<PaymentDto> {
    const escrow = await this.getPaymentRepository().findEscrowByPaymentId(payment.id);
    return { ...payment, escrow, lastTransition };
  }

  private async runTransition(
    payment: PaymentRecord,
    toStatus: PaymentStatus,
    transitionName: PaymentTransitionName,
    guardKeys: readonly string[],
    options: PaymentTransitionOptions,
  ): Promise<{ payment: PaymentRecord; event: WorkflowTransitionEventRecord }> {
    const { identity } = this.requirePlatformSession();
    const assignment = await this.getAssignmentRepository().findById(payment.assignment_id);
    if (!assignment) throw new NotFoundError('Assignment not found for payment.');

    const company = await assertEventCompanyAccess(
      this.context.supabase,
      identity,
      payment.company_profile_id,
    );

    const escrow = await this.getPaymentRepository().findEscrowByPaymentId(payment.id);
    const shifts = await this.getShiftRepository().listByAssignmentId(payment.assignment_id);

    const guardResult = evaluatePaymentGuards(guardKeys, {
      identity,
      payment,
      assignment,
      escrow,
      shifts,
      ownerBusinessUserId: company.owner_business_user_id,
      shiftCompleted: options.shiftCompleted,
      attendanceValidated: options.attendanceValidated,
      refundApproved: options.refundApproved,
    });

    const fromStatus = payment.status;
    const key =
      options.idempotencyKey ??
      buildIdempotencyKey({
        entityType: 'payment',
        entityId: payment.id,
        transitionName,
        requestId: this.context.requestId,
      });

    const isInitial = fromStatus === toStatus && payment.status_version === 0;

    const event = await this.executor.execute({
      entityType: 'payment',
      entityId: payment.id,
      toStatus,
      transitionReason: options.reason,
      transitionedBy: getTransitionedByAuthAccountId(identity),
      transitionSource: resolveWorkflowTransitionSource(identity),
      guardResult,
      metadata: {
        requestId: this.context.requestId,
        transitionName,
        assignmentId: payment.assignment_id,
      },
      idempotencyKey: key,
      correlationId: this.context.requestId,
      expectedFromStatus: isInitial ? null : fromStatus,
      expectedFromStatusVersion: isInitial ? null : payment.status_version,
    });

    const refreshed = await this.getPaymentRepository().findById(payment.id);
    if (!refreshed) throw new NotFoundError('Payment not found after transition.');

    return { payment: refreshed, event };
  }

  /**
   * Creates payment + escrow shell for an assignment and records initial workflow transition.
   */
  async createPaymentForAssignment(assignmentId: string): Promise<PaymentDto> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const assignment = await this.getAssignmentRepository().findById(assignmentId);
    if (!assignment) throw new NotFoundError('Assignment not found.');

    await assertEventCompanyAccess(this.context.supabase, identity, assignment.company_profile_id);

    const existing = await this.getPaymentRepository().findByAssignmentId(assignmentId);
    if (existing) {
      throw new ConflictError('Payment already exists for this assignment.');
    }

    const proposal = await this.getProposalRepository().findById(assignment.proposal_id);
    if (!proposal) throw new NotFoundError('Proposal not found for assignment.');

    const terms = await this.getProposalRepository().findTerms(assignment.proposal_id);
    if (terms?.rate_amount == null || terms.rate_amount <= 0) {
      throw new AppError(
        'PAYMENT_AMOUNT_REQUIRED',
        'Proposal terms must include a positive rate amount before creating payment.',
        422,
      );
    }

    const amount = terms.rate_amount.toFixed(2);
    const currency = terms.rate_currency ?? 'USD';

    const payment = await this.getPaymentRepository().insertPayment({
      assignmentId: assignment.id,
      companyProfileId: assignment.company_profile_id,
      crewUserId: assignment.crew_user_id,
      amount,
      currency,
    });

    await this.getEscrowOrchestration().ensureEscrowRecord(payment);

    const transitionName = this.resolveTransitionName(null, 'pending');
    const { payment: updated, event } = await this.runTransition(
      payment,
      'pending',
      transitionName,
      this.transitionGuardKeys(transitionName),
      { reason: 'Payment created for assignment' },
    );

    return this.toDto(updated, event);
  }

  async authorizePayment(
    paymentId: string,
    input: { reason?: string; idempotencyKey?: string; providerReference?: string } = {},
  ): Promise<PaymentDto> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const payment = await this.getPaymentRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');

    await assertEventCompanyAccess(this.context.supabase, identity, payment.company_profile_id);

    if (payment.status !== 'pending') {
      throw new AppError('PAYMENT_NOT_PENDING', 'Only pending payments can be authorized.', 422);
    }

    const transitionName = this.resolveTransitionName('pending', 'authorized');
    const { payment: updated, event } = await this.runTransition(
      payment,
      'authorized',
      transitionName,
      this.transitionGuardKeys(transitionName),
      { reason: input.reason ?? 'Payment authorized' },
    );

    const authorizedAt = new Date().toISOString();
    const marked = await this.getPaymentRepository().markAuthorized(updated.id, authorizedAt);
    await this.getEscrowOrchestration().ensureEscrowRecord(marked);

    publishStaffingDomainEvent(
      'payments.payment_authorized',
      marked.id,
      {
        assignmentId: marked.assignment_id,
        workflowEventId: event.workflow_event_id,
        providerReference: input.providerReference,
      },
      this.context.requestId,
    );

    return this.toDto(marked, event);
  }

  async fundEscrow(
    paymentId: string,
    input: { reason?: string; idempotencyKey?: string } = {},
  ): Promise<PaymentDto> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const payment = await this.getPaymentRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');

    await assertEventCompanyAccess(this.context.supabase, identity, payment.company_profile_id);

    if (payment.status !== 'authorized') {
      throw new AppError('PAYMENT_NOT_AUTHORIZED', 'Payment must be authorized before funding escrow.', 422);
    }

    const commandId = input.idempotencyKey ?? this.context.requestId;
    const funding = await this.getEscrowOrchestration().fundEscrow(payment, commandId);

    const transitionName = this.resolveTransitionName('authorized', 'funded');
    const { payment: transitioned, event } = await this.runTransition(
      funding.payment,
      'funded',
      transitionName,
      this.transitionGuardKeys(transitionName),
      {
        reason: input.reason ?? 'Escrow funded',
        idempotencyKey: input.idempotencyKey,
      },
    );

    const fundedAt = new Date().toISOString();
    const marked = await this.getPaymentRepository().markFunded(transitioned.id, fundedAt);
    await this.getPaymentRepository().updateEscrowStatus(funding.escrow.id, 'held', {
      fundedAt,
    });

    return this.toDto(marked, event);
  }

  async releasePayment(
    paymentId: string,
    input: {
      reason?: string;
      idempotencyKey?: string;
      shiftId?: string;
      shiftCompleted?: boolean;
      attendanceValidated?: boolean;
    } = {},
  ): Promise<PaymentDto> {
    const payment = await this.getPaymentRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');

    if (payment.status !== 'funded') {
      throw new AppError('PAYMENT_NOT_FUNDED', 'Payment must be funded before release.', 422);
    }

    const commandId = input.idempotencyKey ?? this.context.requestId;
    const shiftContext = input.shiftId
      ? {
          shiftId: input.shiftId,
          shiftCompleted: input.shiftCompleted,
          attendanceValidated: input.attendanceValidated,
        }
      : undefined;
    const release = await this.getEscrowOrchestration().releaseEscrowToWallet(
      payment,
      commandId,
      shiftContext,
    );

    const transitionName = this.resolveTransitionName('funded', 'released');
    const { payment: transitioned, event } = await this.runTransition(
      release.payment,
      'released',
      transitionName,
      this.transitionGuardKeys(transitionName),
      {
        reason: input.reason ?? 'Payment released after shift completion',
        idempotencyKey: input.idempotencyKey,
        shiftCompleted: input.shiftCompleted ?? true,
        attendanceValidated: input.attendanceValidated ?? true,
      },
    );

    const releasedAt = new Date().toISOString();
    const marked = await this.getPaymentRepository().markReleased(transitioned.id, releasedAt);

    return this.toDto(marked, event);
  }

  /**
   * Assignment → shift completion → escrow release → wallet credit.
   */
  async orchestrateReleaseAfterShiftCompleted(
    assignmentId: string,
    shiftId: string,
    input: { reason?: string; idempotencyKey?: string } = {},
  ): Promise<PaymentDto | null> {
    const payment = await this.getPaymentRepository().findByAssignmentId(assignmentId);
    if (!payment) return null;

    if (payment.status === 'released') {
      return this.toDto(payment);
    }

    if (payment.status !== 'funded') {
      return null;
    }

    return this.releasePayment(payment.id, {
      reason: input.reason ?? `Auto-release after shift ${shiftId} completed`,
      idempotencyKey: input.idempotencyKey,
      shiftId,
      shiftCompleted: true,
    });
  }

  async createRefund(
    paymentId: string,
    input: { reason?: string; idempotencyKey?: string; amount?: string } = {},
  ): Promise<PaymentDto> {
    const { identity } = this.requirePlatformSession();
    assertBusinessUser(identity);

    const payment = await this.getPaymentRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');

    await assertEventCompanyAccess(this.context.supabase, identity, payment.company_profile_id);

    if (payment.status !== 'funded' && payment.status !== 'released') {
      throw new AppError(
        'PAYMENT_NOT_REFUNDABLE',
        'Refunds are supported for funded or released payments in this foundation.',
        422,
      );
    }

    const escrow = await this.getPaymentRepository().findEscrowByPaymentId(payment.id);
    const refundAmount = input.amount ?? payment.amount;

    const refund = await this.getPaymentRepository().insertRefund({
      paymentId: payment.id,
      escrowRecordId: escrow?.id,
      amount: refundAmount,
      currency: payment.currency,
      requestedByBusinessUserId: identity.businessUser?.id,
      reason: input.reason,
    });

    publishStaffingDomainEvent(
      'payments.refund_created',
      refund.id,
      { paymentId: payment.id, amount: refundAmount, currency: payment.currency },
      this.context.requestId,
    );

    if (payment.status === 'funded') {
      const commandId = input.idempotencyKey ?? this.context.requestId;
      await this.getEscrowOrchestration().createRefundLedger(payment, refund.id, commandId);

      const transitionName = this.resolveTransitionName('funded', 'refunded');
      const { payment: updated, event } = await this.runTransition(
        payment,
        'refunded',
        transitionName,
        this.transitionGuardKeys(transitionName),
        {
          reason: input.reason ?? 'Funded payment refunded',
          idempotencyKey: input.idempotencyKey,
          refundApproved: true,
        },
      );

      return this.toDto(updated, event);
    }

    return this.toDto(payment);
  }

  async preparePayout(crewUserId: string, amount: string, currency: string): Promise<PayoutPreparationResult> {
    const { identity } = this.requirePlatformSession();

    if (identity.crewUser?.id !== crewUserId && identity.role !== 'platform_admin') {
      throw new AppError('FORBIDDEN', 'Cannot prepare payout for another crew user.', 403);
    }

    await this.getPaymentRepository().ensureCrewWallet(crewUserId, currency);
    const balance = await this.getPaymentRepository().getWalletBalance(crewUserId, currency);
    const available = balance?.available_balance ?? '0.00';
    const requested = Number.parseFloat(amount);
    const availableNum = Number.parseFloat(available);

    const canPayout = requested > 0 && requested <= availableNum;

    return {
      crewUserId,
      currency,
      requestedAmount: amount,
      availableBalance: available,
      canPayout,
      detail: canPayout ? undefined : 'insufficient_available_balance',
    };
  }

  async getPayment(paymentId: string): Promise<PaymentDto> {
    const { identity } = this.requirePlatformSession();
    const payment = await this.getPaymentRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');

    if (identity.role !== 'platform_admin') {
      if (identity.crewUser?.id === payment.crew_user_id) {
        // crew read
      } else {
        await assertEventCompanyAccess(this.context.supabase, identity, payment.company_profile_id);
      }
    }

    const events = await this.getPaymentRepository().listWorkflowEvents(paymentId);
    const last =
      events.length > 0 ? (events[events.length - 1] as WorkflowTransitionEventRecord) : null;

    return this.toDto(payment, last);
  }

  async getPaymentByAssignment(assignmentId: string): Promise<PaymentDto | null> {
    const payment = await this.getPaymentRepository().findByAssignmentId(assignmentId);
    if (!payment) return null;
    return this.getPayment(payment.id);
  }

  async getPaymentTimeline(paymentId: string) {
    await this.getPayment(paymentId);
    return this.getPaymentRepository().listWorkflowEvents(paymentId);
  }
}
