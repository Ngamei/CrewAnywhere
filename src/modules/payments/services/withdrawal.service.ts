import {
  WorkflowTransitionExecutor,
  buildIdempotencyKey,
  evaluateWithdrawalGuards,
} from '@/backend/services/workflow';
import type { WorkflowTransitionEventRecord } from '@/backend/services/workflow';
import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import {
  getTransitionedByAuthAccountId,
  resolveWorkflowTransitionSource,
} from '@/backend/auth/authorization';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/api/errors';
import { assertCrewOwnership } from '@/shared/auth/ownership';
import { assertCrewUser } from '@/shared/auth/guards';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { publishStaffingDomainEvent } from '@/modules/events/services/domain-event-publisher';
import { LedgerRepository, PaymentRepository, WithdrawalRepository } from '@/modules/payments/repositories';
import type { CreateWithdrawalInput } from '@/modules/payments/schemas';
import type {
  PayoutMethodDto,
  WithdrawalDto,
  WithdrawalRequestResultDto,
  WithdrawalSourcePaymentDto,
} from '@/modules/payments/types/withdrawal-dtos';
import type { WithdrawalRequestRecord } from '@/modules/payments/types/payment-records';
import type { WithdrawalActivityRecord } from '@/modules/payments/types/withdrawal-activity-records';
import { withdrawalWorkflowMachine } from '@/shared/state/workflows/withdrawal-lifecycle';
import type { WithdrawalTransitionName } from '@/shared/state/workflows/withdrawal-lifecycle';
import type { WithdrawalStatus } from '@/shared/state/enums/withdrawal-status';
import { WithdrawalLedgerService } from './withdrawal-ledger.service';
import {
  assertWithdrawalWorkflowLedgerSynchronized,
  loadWithdrawalLedgerLines,
} from './workflow-ledger-sync';

type WithdrawalTransitionOptions = {
  reason: string;
  idempotencyKey?: string;
  commandId?: string;
  riskScreenPassed?: boolean;
  riskScreenFailed?: boolean;
  providerPayoutCreated?: boolean;
  providerPayoutConfirmed?: boolean;
  providerPayoutFailed?: boolean;
  providerRejected?: boolean;
};

export type RequestWithdrawalInput = CreateWithdrawalInput & {
  crewUserId: string;
};

export class WithdrawalService extends AuthenticatedBaseService {
  private readonly executor = new WorkflowTransitionExecutor();

  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getWithdrawalRepository() {
    return new WithdrawalRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getPaymentRepository() {
    return new PaymentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getLedgerRepository() {
    return new LedgerRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private getWithdrawalLedger() {
    return new WithdrawalLedgerService(this.context);
  }

  private foundationAutoAdvanceEnabled() {
    return process.env.CREWANYWHERE_FOUNDATION_WITHDRAWAL_STUB !== 'false';
  }

  private resolveTransitionName(
    from: WithdrawalStatus | null,
    to: WithdrawalStatus,
  ): WithdrawalTransitionName {
    const transition = withdrawalWorkflowMachine.getTransition(from, to);
    if (!transition) {
      throw new AppError('INVALID_TRANSITION', `No workflow transition from ${from} to ${to}`, 422);
    }
    return transition.name;
  }

  private transitionGuardKeys(transitionName: WithdrawalTransitionName): readonly string[] {
    return withdrawalWorkflowMachine.getTransitionByName(transitionName)?.metadata.guardKeys ?? [];
  }

  private async loadGuardContext(withdrawal: WithdrawalRequestRecord) {
    const repo = this.getWithdrawalRepository();
    const payment = await repo.findPaymentById(withdrawal.payment_id);
    if (!payment) throw new NotFoundError('Payment not found for withdrawal.');

    const payoutMethod = await repo.findPayoutMethod(
      withdrawal.payout_method_id,
      withdrawal.crew_user_id,
    );
    const walletBalance = await this.getPaymentRepository().getWalletBalance(
      withdrawal.crew_user_id,
      withdrawal.currency,
    );
    const ledgerLines = await loadWithdrawalLedgerLines(
      this.getLedgerRepository(),
      withdrawal.id,
    );

    return { payment, payoutMethod, walletBalance, ledgerLines };
  }

  private async toDto(
    withdrawal: WithdrawalRequestRecord,
    lastTransition: WorkflowTransitionEventRecord | null = null,
  ): Promise<WithdrawalDto> {
    return { ...withdrawal, lastTransition };
  }

  private publishWithdrawalEvent(
    name:
      | 'payments.withdrawal_requested'
      | 'payments.withdrawal_reviewing'
      | 'payments.withdrawal_approved'
      | 'payments.withdrawal_processing'
      | 'payments.withdrawal_paid'
      | 'payments.withdrawal_failed'
      | 'payments.withdrawal_cancelled',
    withdrawal: WithdrawalRequestRecord,
    event: WorkflowTransitionEventRecord,
  ) {
    publishStaffingDomainEvent(
      name,
      withdrawal.id,
      {
        paymentId: withdrawal.payment_id,
        crewUserId: withdrawal.crew_user_id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: withdrawal.status,
        workflowEventId: event.workflow_event_id,
      },
      this.context.requestId,
    );
  }

  private eventNameForStatus(status: WithdrawalStatus) {
    switch (status) {
      case 'requested':
        return 'payments.withdrawal_requested' as const;
      case 'under_review':
        return 'payments.withdrawal_reviewing' as const;
      case 'approved':
        return 'payments.withdrawal_approved' as const;
      case 'processing':
        return 'payments.withdrawal_processing' as const;
      case 'paid':
        return 'payments.withdrawal_paid' as const;
      case 'rejected':
        return 'payments.withdrawal_failed' as const;
      case 'cancelled':
        return 'payments.withdrawal_cancelled' as const;
    }
  }

  private async runTransition(
    withdrawal: WithdrawalRequestRecord,
    toStatus: WithdrawalStatus,
    transitionName: WithdrawalTransitionName,
    guardKeys: readonly string[],
    options: WithdrawalTransitionOptions,
  ): Promise<{ withdrawal: WithdrawalRequestRecord; event: WorkflowTransitionEventRecord }> {
    const { identity } = this.requirePlatformSession();
    const guardContext = await this.loadGuardContext(withdrawal);

    const guardResult = evaluateWithdrawalGuards(guardKeys, {
      identity,
      withdrawal,
      payment: guardContext.payment,
      payoutMethod: guardContext.payoutMethod,
      walletBalance: guardContext.walletBalance,
      ledgerLines: guardContext.ledgerLines,
      riskScreenPassed: options.riskScreenPassed,
      riskScreenFailed: options.riskScreenFailed,
      providerPayoutCreated: options.providerPayoutCreated,
      providerPayoutConfirmed: options.providerPayoutConfirmed,
      providerPayoutFailed: options.providerPayoutFailed,
      providerRejected: options.providerRejected,
    });

    const fromStatus = withdrawal.status;
    const key =
      options.idempotencyKey ??
      buildIdempotencyKey({
        entityType: 'withdrawal',
        entityId: withdrawal.id,
        transitionName,
        requestId: this.context.requestId,
      });

    const isInitial = fromStatus === toStatus && withdrawal.status_version === 0;

    const event = await this.executor.execute({
      entityType: 'withdrawal',
      entityId: withdrawal.id,
      toStatus,
      transitionReason: options.reason,
      transitionedBy: getTransitionedByAuthAccountId(identity),
      transitionSource: resolveWorkflowTransitionSource(identity),
      guardResult,
      metadata: {
        requestId: this.context.requestId,
        transitionName,
        paymentId: withdrawal.payment_id,
      },
      idempotencyKey: key,
      correlationId: this.context.requestId,
      expectedFromStatus: isInitial ? null : fromStatus,
      expectedFromStatusVersion: isInitial ? null : withdrawal.status_version,
    });

    const refreshed = await this.getWithdrawalRepository().findById(withdrawal.id);
    if (!refreshed) throw new NotFoundError('Withdrawal not found after transition.');

    this.publishWithdrawalEvent(this.eventNameForStatus(toStatus), refreshed, event);

    const ledgerLines = await loadWithdrawalLedgerLines(this.getLedgerRepository(), refreshed.id);
    assertWithdrawalWorkflowLedgerSynchronized({
      withdrawalId: refreshed.id,
      withdrawalStatus: refreshed.status,
      ledgerLines,
    });

    return { withdrawal: refreshed, event };
  }

  private async transitionByName(
    withdrawal: WithdrawalRequestRecord,
    transitionName: WithdrawalTransitionName,
    options: WithdrawalTransitionOptions,
  ) {
    const rule = withdrawalWorkflowMachine.getTransitionByName(transitionName);
    if (!rule || rule.to == null) {
      throw new AppError('INVALID_TRANSITION', `Unknown transition ${transitionName}`, 422);
    }

    return this.runTransition(
      withdrawal,
      rule.to,
      transitionName,
      this.transitionGuardKeys(transitionName),
      options,
    );
  }

  async getWithdrawal(withdrawalId: string): Promise<WithdrawalDto> {
    const { identity } = this.requirePlatformSession();
    const withdrawal = await this.getWithdrawalRepository().findById(withdrawalId);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found.');

    if (identity.role !== 'platform_admin') {
      assertCrewOwnership(identity, withdrawal.crew_user_id);
    }

    const events = await this.getWithdrawalRepository().listWorkflowEvents(withdrawalId);
    const last =
      events.length > 0 ? (events[events.length - 1] as WorkflowTransitionEventRecord) : null;

    return this.toDto(withdrawal, last);
  }

  async listWithdrawalSources(crewUserId: string): Promise<WithdrawalSourcePaymentDto[]> {
    const identity = this.requirePlatformIdentity();
    assertCrewOwnership(identity, crewUserId);

    const repo = this.getWithdrawalRepository();
    const payments = await repo.listWithdrawalSourcePayments(crewUserId);

    return Promise.all(
      payments.map(async (payment) => {
        const active = await repo.findActiveByPaymentId(payment.id);
        return {
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          releasedAt: payment.released_at,
          hasActiveWithdrawal: Boolean(active),
        };
      }),
    );
  }

  async listPayoutMethods(crewUserId: string): Promise<PayoutMethodDto[]> {
    const identity = this.requirePlatformIdentity();
    assertCrewOwnership(identity, crewUserId);

    const methods = await this.getWithdrawalRepository().listPayoutMethods(crewUserId);
    return methods.map((method) => ({
      id: method.id,
      displayName:
        method.display_name ??
        method.method_type
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
      methodType: method.method_type,
      isDefault: method.is_default,
      verified: method.verified_at != null,
    }));
  }

  async requestWithdrawal(input: RequestWithdrawalInput): Promise<WithdrawalRequestResultDto> {
    const { identity } = this.requirePlatformSession();
    assertCrewUser(identity);
    assertCrewOwnership(identity, input.crewUserId);

    const repo = this.getWithdrawalRepository();
    const payment = await repo.findPaymentById(input.paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');
    if (payment.crew_user_id !== input.crewUserId) {
      throw new ForbiddenError('Payment does not belong to this crew user.');
    }
    if (payment.status !== 'released') {
      throw new AppError('PAYMENT_NOT_RELEASED', 'Withdrawals require a released payment.', 422);
    }

    const requestedAmount = Number.parseFloat(input.amount);
    const paymentAmount = Number.parseFloat(payment.amount);
    if (requestedAmount <= 0 || requestedAmount > paymentAmount) {
      throw new AppError('WITHDRAWAL_AMOUNT_INVALID', 'Withdrawal amount exceeds payment amount.', 422);
    }

    const active = await repo.findActiveByPaymentId(payment.id);
    if (active) {
      throw new ConflictError('An active withdrawal already exists for this payment.');
    }

    const payoutMethod = input.payoutMethodId
      ? await repo.findPayoutMethod(input.payoutMethodId, input.crewUserId)
      : await repo.findDefaultPayoutMethod(input.crewUserId);

    if (!payoutMethod) {
      throw new AppError('PAYOUT_METHOD_REQUIRED', 'A verified payout method is required.', 422);
    }

    await this.getPaymentRepository().ensureCrewWallet(input.crewUserId, input.currency);
    const balance = await this.getPaymentRepository().getWalletBalance(input.crewUserId, input.currency);
    const available = Number.parseFloat(balance?.available_balance?.toString() ?? '0');
    if (requestedAmount > available) {
      throw new AppError('INSUFFICIENT_BALANCE', 'Insufficient available wallet balance.', 422);
    }

    const withdrawal = await repo.insertWithdrawal({
      paymentId: payment.id,
      companyProfileId: payment.company_profile_id,
      crewUserId: payment.crew_user_id,
      payoutMethodId: payoutMethod.id,
      amount: input.amount,
      currency: input.currency,
    });

    const commandId = input.idempotencyKey ?? this.context.requestId;
    let activity: WithdrawalActivityRecord | null = null;

    const initial = await this.transitionByName(withdrawal, 'request_withdrawal', {
      reason: input.reason ?? 'Crew withdrawal requested',
      idempotencyKey: input.idempotencyKey,
      commandId,
    });

    let current = initial.withdrawal;
    const autoAdvance = input.autoAdvance ?? this.foundationAutoAdvanceEnabled();

    if (autoAdvance) {
      const reservation = await this.getWithdrawalLedger().postReservation(
        current,
        payment,
        `${commandId}:reservation`,
      );
      activity = reservation.activity;

      const approved = await this.transitionByName(current, 'approve_low_risk_withdrawal', {
        reason: 'Auto-approved (foundation)',
        commandId: `${commandId}:approve`,
        riskScreenPassed: true,
      });
      current = approved.withdrawal;

      const processing = await this.transitionByName(current, 'process_withdrawal', {
        reason: 'Provider payout initiated (foundation)',
        commandId: `${commandId}:process`,
        providerPayoutCreated: true,
      });
      current = processing.withdrawal;

      const payout = await this.getWithdrawalLedger().postPayout(
        current,
        payment,
        `${commandId}:payout`,
      );
      activity = payout.activity;

      const paid = await this.transitionByName(current, 'mark_withdrawal_paid', {
        reason: 'Payout confirmed (foundation)',
        commandId: `${commandId}:paid`,
        providerPayoutConfirmed: true,
      });
      current = await this.getWithdrawalRepository().markProcessedAt(
        paid.withdrawal.id,
        new Date().toISOString(),
      );
    }

    const events = await repo.listWorkflowEvents(current.id);
    const last =
      events.length > 0 ? (events[events.length - 1] as WorkflowTransitionEventRecord) : initial.event;

    return {
      withdrawal: await this.toDto(current, last),
      activity,
    };
  }

  async cancelWithdrawal(withdrawalId: string, options: WithdrawalTransitionOptions = { reason: 'Cancelled by crew' }) {
    const withdrawal = await this.getWithdrawalForCrewAction(withdrawalId);
    const { payment } = await this.loadGuardContext(withdrawal);
    const commandId = options.commandId ?? this.context.requestId;

    const transitionName =
      withdrawal.status === 'under_review'
        ? 'cancel_reviewed_withdrawal'
        : 'cancel_requested_withdrawal';

    if (withdrawal.status === 'approved') {
      await this.getWithdrawalLedger().postReservationReversal(
        withdrawal,
        payment,
        `${commandId}:reversal`,
      );
    }

    const result = await this.transitionByName(withdrawal, transitionName, {
      ...options,
      commandId,
    });

    return this.toDto(result.withdrawal, result.event);
  }

  async reviewWithdrawal(withdrawalId: string, options: WithdrawalTransitionOptions) {
    this.requirePlatformAdmin();
    const withdrawal = await this.requireWithdrawal(withdrawalId);
    const result = await this.transitionByName(withdrawal, 'review_withdrawal', options);
    return this.toDto(result.withdrawal, result.event);
  }

  async approveWithdrawal(withdrawalId: string, options: WithdrawalTransitionOptions) {
    this.requirePlatformAdmin();
    let withdrawal = await this.requireWithdrawal(withdrawalId);
    const { payment } = await this.loadGuardContext(withdrawal);
    const commandId = options.commandId ?? this.context.requestId;

    if (withdrawal.status === 'under_review') {
      await this.getWithdrawalLedger().postReservation(withdrawal, payment, `${commandId}:reservation`);
      const reviewed = await this.transitionByName(withdrawal, 'approve_reviewed_withdrawal', {
        ...options,
        riskScreenPassed: true,
        commandId: `${commandId}:approve-reviewed`,
      });
      withdrawal = reviewed.withdrawal;
    } else if (withdrawal.status === 'requested') {
      await this.getWithdrawalLedger().postReservation(withdrawal, payment, `${commandId}:reservation`);
      const approved = await this.transitionByName(withdrawal, 'approve_low_risk_withdrawal', {
        ...options,
        riskScreenPassed: true,
        commandId: `${commandId}:approve`,
      });
      withdrawal = approved.withdrawal;
    }

    return this.getWithdrawal(withdrawal.id);
  }

  async rejectWithdrawal(withdrawalId: string, options: WithdrawalTransitionOptions) {
    this.requirePlatformAdmin();
    const withdrawal = await this.requireWithdrawal(withdrawalId);
    const { payment } = await this.loadGuardContext(withdrawal);
    const commandId = options.commandId ?? this.context.requestId;

    const hasReservation = (await loadWithdrawalLedgerLines(this.getLedgerRepository(), withdrawal.id)).some(
      (line) => line.transaction_type === 'withdrawal',
    );
    if (hasReservation) {
      await this.getWithdrawalLedger().postReservationReversal(
        withdrawal,
        payment,
        `${commandId}:reversal`,
      );
    }

    const transitionName =
      withdrawal.status === 'under_review'
        ? 'reject_reviewed_withdrawal'
        : withdrawal.status === 'approved'
          ? 'reject_approved_withdrawal'
          : 'reject_requested_withdrawal';

    const result = await this.transitionByName(withdrawal, transitionName, {
      ...options,
      riskScreenFailed: true,
      providerRejected: withdrawal.status === 'approved',
      commandId,
    });

    return this.toDto(result.withdrawal, result.event);
  }

  async processWithdrawal(withdrawalId: string, options: WithdrawalTransitionOptions) {
    this.requirePlatformAdmin();
    const withdrawal = await this.requireWithdrawal(withdrawalId);
    const result = await this.transitionByName(withdrawal, 'process_withdrawal', {
      ...options,
      providerPayoutCreated: true,
    });
    return this.toDto(result.withdrawal, result.event);
  }

  async markWithdrawalPaid(withdrawalId: string, options: WithdrawalTransitionOptions) {
    this.requirePlatformAdmin();
    const withdrawal = await this.requireWithdrawal(withdrawalId);
    const { payment } = await this.loadGuardContext(withdrawal);
    const commandId = options.commandId ?? this.context.requestId;

    await this.getWithdrawalLedger().postPayout(withdrawal, payment, `${commandId}:payout`);

    const result = await this.transitionByName(withdrawal, 'mark_withdrawal_paid', {
      ...options,
      providerPayoutConfirmed: true,
      commandId,
    });

    const processed = await this.getWithdrawalRepository().markProcessedAt(
      result.withdrawal.id,
      new Date().toISOString(),
    );

    return this.toDto(processed, result.event);
  }

  async markWithdrawalFailed(withdrawalId: string, options: WithdrawalTransitionOptions) {
    this.requirePlatformAdmin();
    const withdrawal = await this.requireWithdrawal(withdrawalId);
    const { payment } = await this.loadGuardContext(withdrawal);
    const commandId = options.commandId ?? this.context.requestId;

    const hasReservation = (await loadWithdrawalLedgerLines(this.getLedgerRepository(), withdrawal.id)).some(
      (line) => line.transaction_type === 'withdrawal',
    );
    if (hasReservation) {
      await this.getWithdrawalLedger().postReservationReversal(
        withdrawal,
        payment,
        `${commandId}:reversal`,
      );
    }

    const result = await this.transitionByName(withdrawal, 'mark_withdrawal_failed', {
      ...options,
      providerPayoutFailed: true,
      commandId,
    });

    return this.toDto(result.withdrawal, result.event);
  }

  private requirePlatformAdmin() {
    const { identity } = this.requirePlatformSession();
    if (identity.role !== 'platform_admin') {
      throw new ForbiddenError('Platform admin role required.');
    }
    return identity;
  }

  private async requireWithdrawal(withdrawalId: string) {
    const withdrawal = await this.getWithdrawalRepository().findById(withdrawalId);
    if (!withdrawal) throw new NotFoundError('Withdrawal not found.');
    return withdrawal;
  }

  private async getWithdrawalForCrewAction(withdrawalId: string) {
    const { identity } = this.requirePlatformSession();
    const withdrawal = await this.requireWithdrawal(withdrawalId);
    assertCrewOwnership(identity, withdrawal.crew_user_id);
    return withdrawal;
  }
}
