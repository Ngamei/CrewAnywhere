import { AuthenticatedBaseService } from '@/backend/services/base-service';
import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { ForbiddenError, NotFoundError } from '@/shared/api/errors';
import { assertCrewOwnership } from '@/shared/auth/ownership';
import { createDomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import { assertEventCompanyAccess } from '@/modules/events/hooks';
import { PaymentRepository } from '@/modules/payments/repositories';
import { toEscrowReadModel } from '@/modules/payments/hooks/escrow-read-model';
import { resolvePaymentListOperationalLabel } from '@/modules/payments/types';
import type {
  EscrowReadModel,
  EscrowTimelineEntry,
  LedgerGroupTimelineDto,
  PaymentListItemDto,
  PaymentWithWithdrawalDto,
} from '@/modules/payments/types';
import type { FinanceTransactionType } from '@/shared/state/enums/finance-transaction-type';

export class PaymentReadService extends AuthenticatedBaseService {
  constructor(context: AuthenticatedServiceContext) {
    super(context);
  }

  private getRepository() {
    return new PaymentRepository(createDomainRepositoryClients(this.context.supabase));
  }

  private async assertPaymentReadAccess(payment: { crew_user_id: string; company_profile_id: string }) {
    const identity = this.requirePlatformIdentity();

    if (identity.role === 'platform_admin') {
      return;
    }

    if (identity.crewUser) {
      assertCrewOwnership(identity, payment.crew_user_id);
      return;
    }

    if (identity.businessUser) {
      await assertEventCompanyAccess(this.context.supabase, identity, payment.company_profile_id);
      return;
    }

    throw new ForbiddenError('Not permitted to view this payment.');
  }

  async listPayments(
    filters: { companyProfileId?: string; crewUserId?: string; status?: string } = {},
  ): Promise<PaymentListItemDto[]> {
    const identity = this.requirePlatformIdentity();
    const resolvedFilters = { ...filters };

    if (identity.crewUser && !resolvedFilters.crewUserId) {
      resolvedFilters.crewUserId = identity.crewUser.id;
    }

    const payments = await this.getRepository().list(resolvedFilters);
    const escrows = await this.getRepository().listEscrowsByPaymentIds(payments.map((p) => p.id));
    const escrowByPayment = new Map(escrows.map((e) => [e.payment_id, e]));

    return payments.map((payment) => {
      const escrow = escrowByPayment.get(payment.id);
      return {
        id: payment.id,
        assignment_id: payment.assignment_id,
        company_profile_id: payment.company_profile_id,
        crew_user_id: payment.crew_user_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        escrowStatus: escrow?.status ?? null,
        operationalLabel: resolvePaymentListOperationalLabel(payment.status),
      };
    });
  }

  async getPaymentWithWithdrawal(paymentId: string): Promise<PaymentWithWithdrawalDto> {
    const payment = await this.getRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');

    await this.assertPaymentReadAccess(payment);

    const escrow = await this.getRepository().findEscrowByPaymentId(paymentId);

    return {
      ...payment,
      escrow,
      lastTransition: null,
      activeWithdrawal: null,
    };
  }

  async getPaymentTimeline(paymentId: string) {
    const payment = await this.getRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');
    await this.assertPaymentReadAccess(payment);

    const events = await this.getRepository().listWorkflowEvents(paymentId);
    return events.map((event) => ({
      workflow_event_id: event.workflow_event_id,
      from_status: event.from_status,
      to_status: event.to_status,
      transition_reason: event.transition_reason,
      transition_source: event.transition_source,
      created_at: event.created_at,
    }));
  }

  async getEscrowReadModel(paymentId: string): Promise<EscrowReadModel | null> {
    const payment = await this.getRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');
    await this.assertPaymentReadAccess(payment);

    const escrow = await this.getRepository().findEscrowByPaymentId(paymentId);
    return escrow ? toEscrowReadModel(escrow) : null;
  }

  async getEscrowTimeline(paymentId: string): Promise<EscrowTimelineEntry[]> {
    const payment = await this.getRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');
    await this.assertPaymentReadAccess(payment);

    const escrow = await this.getRepository().findEscrowByPaymentId(paymentId);
    if (!escrow) return [];

    const [events, ledgerRows] = await Promise.all([
      this.getRepository().listWorkflowEvents(paymentId),
      this.getRepository().listLedgerGroupsForPayment(paymentId),
    ]);

    const timeline: EscrowTimelineEntry[] = [];

    for (const event of events) {
      if (!['authorized', 'funded', 'released', 'refunded'].includes(event.to_status)) {
        continue;
      }

      timeline.push({
        id: event.workflow_event_id,
        escrowId: escrow.id,
        fromStatus: null,
        toStatus: escrow.status,
        label: event.transition_reason ?? `Payment ${event.to_status}`,
        timestamp: event.created_at,
        source: event.transition_source ?? 'payment_workflow',
      });
    }

    const groups = groupLedgerRows(ledgerRows);
    for (const group of groups) {
      if (!['escrow_funding', 'escrow_release'].includes(group.transactionType)) {
        continue;
      }

      timeline.push({
        id: group.ledgerEntryGroupId,
        escrowId: escrow.id,
        fromStatus: null,
        toStatus: escrow.status,
        label:
          group.transactionType === 'escrow_funding'
            ? 'Escrow funded — ledger posted'
            : 'Escrow released to crew wallet',
        timestamp: group.postedAt,
        source: 'ledger_posted',
      });
    }

    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return timeline;
  }

  async getLedgerHistory(paymentId: string): Promise<LedgerGroupTimelineDto[]> {
    const payment = await this.getRepository().findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');
    await this.assertPaymentReadAccess(payment);

    const rows = await this.getRepository().listLedgerGroupsForPayment(paymentId);
    return groupLedgerRows(rows);
  }
}

function groupLedgerRows(
  rows: {
    id: string;
    ledger_entry_group_id: string;
    entry_sequence: number;
    payment_id: string | null;
    withdrawal_request_id: string | null;
    ledger_account: string;
    direction: string;
    transaction_type: string;
    amount: string;
    currency: string;
    posted_at: string;
  }[],
): LedgerGroupTimelineDto[] {
  const groups = new Map<string, LedgerGroupTimelineDto>();

  for (const row of rows) {
    const line = {
      id: row.id,
      ledgerEntryGroupId: row.ledger_entry_group_id,
      entrySequence: row.entry_sequence,
      paymentId: row.payment_id,
      escrowRecordId: null,
      withdrawalRequestId: row.withdrawal_request_id,
      ledgerAccount: row.ledger_account as LedgerGroupTimelineDto['lines'][0]['ledgerAccount'],
      direction: row.direction as LedgerGroupTimelineDto['lines'][0]['direction'],
      transactionType: row.transaction_type as FinanceTransactionType,
      amount: String(row.amount),
      currency: row.currency,
      postedAt: row.posted_at,
      externalReference: null,
    };

    const existing = groups.get(row.ledger_entry_group_id);
    if (!existing) {
      groups.set(row.ledger_entry_group_id, {
        ledgerEntryGroupId: row.ledger_entry_group_id,
        transactionType: row.transaction_type as FinanceTransactionType,
        currency: row.currency,
        netAmount: String(row.amount),
        postedAt: row.posted_at,
        lines: [line],
        paymentId: row.payment_id,
        withdrawalRequestId: row.withdrawal_request_id,
      });
      continue;
    }

    existing.lines.push(line);
    const creditTotal = existing.lines
      .filter((l) => l.direction === 'credit')
      .reduce((sum, l) => sum + Number(l.amount), 0);
    const debitTotal = existing.lines
      .filter((l) => l.direction === 'debit')
      .reduce((sum, l) => sum + Number(l.amount), 0);
    existing.netAmount = String(Math.abs(creditTotal - debitTotal));
  }

  return [...groups.values()].sort(
    (a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime(),
  );
}
