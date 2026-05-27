import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { EscrowStatus } from '@/shared/state/enums/escrow-status';
import type {
  CrewWalletBalanceRecord,
  CrewWalletRecord,
} from '@/modules/payments/types/wallet-records';
import type { EscrowRecord, PaymentRecord } from '@/modules/payments/types/payment-records';

const PAYMENT_COLUMNS =
  'id, assignment_id, company_profile_id, crew_user_id, amount, currency, status, status_version, authorized_at, funded_at, released_at, created_at, updated_at, deleted_at';

const ESCROW_COLUMNS =
  'id, payment_id, provider, provider_reference, status, amount_held, currency, funded_at, released_at, created_at, updated_at, deleted_at';

const WALLET_COLUMNS =
  'id, crew_user_id, default_currency, payouts_enabled, created_at, updated_at, deleted_at';

const WALLET_BALANCE_COLUMNS =
  'crew_user_id, currency, available_balance, pending_balance, lifetime_earnings, last_ledger_entry_at';

export class PaymentRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const { data, error } = await this.clients.read
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as PaymentRecord | null;
  }

  async findByAssignmentId(assignmentId: string): Promise<PaymentRecord | null> {
    const { data, error } = await this.clients.read
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('assignment_id', assignmentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as PaymentRecord | null;
  }

  async insertPayment(input: {
    assignmentId: string;
    companyProfileId: string;
    crewUserId: string;
    amount: string;
    currency: string;
  }): Promise<PaymentRecord> {
    const { data, error } = await this.clients.write
      .from('payments')
      .insert({
        assignment_id: input.assignmentId,
        company_profile_id: input.companyProfileId,
        crew_user_id: input.crewUserId,
        amount: input.amount,
        currency: input.currency,
        status: 'pending',
      })
      .select(PAYMENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as PaymentRecord;
  }

  async markAuthorized(paymentId: string, authorizedAt: string): Promise<PaymentRecord> {
    const { data, error } = await this.clients.write
      .from('payments')
      .update({ authorized_at: authorizedAt })
      .eq('id', paymentId)
      .is('deleted_at', null)
      .select(PAYMENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as PaymentRecord;
  }

  async markFunded(paymentId: string, fundedAt: string): Promise<PaymentRecord> {
    const { data, error } = await this.clients.write
      .from('payments')
      .update({ funded_at: fundedAt })
      .eq('id', paymentId)
      .is('deleted_at', null)
      .select(PAYMENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as PaymentRecord;
  }

  async markReleased(paymentId: string, releasedAt: string): Promise<PaymentRecord> {
    const { data, error } = await this.clients.write
      .from('payments')
      .update({ released_at: releasedAt })
      .eq('id', paymentId)
      .is('deleted_at', null)
      .select(PAYMENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as PaymentRecord;
  }

  async findEscrowByPaymentId(paymentId: string): Promise<EscrowRecord | null> {
    const { data, error } = await this.clients.read
      .from('escrow_records')
      .select(ESCROW_COLUMNS)
      .eq('payment_id', paymentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as EscrowRecord | null;
  }

  async insertEscrow(input: {
    paymentId: string;
    amount: string;
    currency: string;
    provider?: string;
    providerReference?: string;
  }): Promise<EscrowRecord> {
    const { data, error } = await this.clients.write
      .from('escrow_records')
      .insert({
        payment_id: input.paymentId,
        status: 'awaiting_funding',
        amount_held: input.amount,
        currency: input.currency,
        provider: input.provider ?? null,
        provider_reference: input.providerReference ?? null,
      })
      .select(ESCROW_COLUMNS)
      .single();

    if (error) throw error;
    return data as EscrowRecord;
  }

  async updateEscrowStatus(
    escrowId: string,
    status: EscrowStatus,
    patch: { amountHeld?: string; fundedAt?: string; releasedAt?: string } = {},
  ): Promise<EscrowRecord> {
    const { data, error } = await this.clients.write
      .from('escrow_records')
      .update({
        status,
        ...(patch.amountHeld != null ? { amount_held: patch.amountHeld } : {}),
        ...(patch.fundedAt != null ? { funded_at: patch.fundedAt } : {}),
        ...(patch.releasedAt != null ? { released_at: patch.releasedAt } : {}),
      })
      .eq('id', escrowId)
      .is('deleted_at', null)
      .select(ESCROW_COLUMNS)
      .single();

    if (error) throw error;
    return data as EscrowRecord;
  }

  async insertRefund(input: {
    paymentId: string;
    escrowRecordId?: string;
    amount: string;
    currency: string;
    requestedByBusinessUserId?: string;
    reason?: string;
  }) {
    const { data, error } = await this.clients.write
      .from('refunds')
      .insert({
        payment_id: input.paymentId,
        escrow_record_id: input.escrowRecordId ?? null,
        amount: input.amount,
        currency: input.currency,
        requested_by_business_user_id: input.requestedByBusinessUserId ?? null,
        reason: input.reason ?? null,
        status: 'requested',
      })
      .select(
        'id, payment_id, escrow_record_id, amount, currency, status, reason, processed_at, created_at, updated_at, deleted_at',
      )
      .single();

    if (error) throw error;
    return data;
  }

  async ensureCrewWallet(crewUserId: string, currency: string): Promise<CrewWalletRecord> {
    const existing = await this.findCrewWallet(crewUserId);
    if (existing) return existing;

    const { data, error } = await this.clients.write
      .from('crew_wallets')
      .insert({
        crew_user_id: crewUserId,
        default_currency: currency,
      })
      .select(WALLET_COLUMNS)
      .single();

    if (error) throw error;
    return data as CrewWalletRecord;
  }

  async findCrewWallet(crewUserId: string): Promise<CrewWalletRecord | null> {
    const { data, error } = await this.clients.read
      .from('crew_wallets')
      .select(WALLET_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as CrewWalletRecord | null;
  }

  async getWalletBalance(crewUserId: string, currency: string): Promise<CrewWalletBalanceRecord | null> {
    const { data, error } = await this.clients.read
      .from('crew_wallet_balances')
      .select(WALLET_BALANCE_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .eq('currency', currency)
      .maybeSingle();

    if (error) throw error;
    return data as CrewWalletBalanceRecord | null;
  }

  async list(filters: {
    companyProfileId?: string;
    crewUserId?: string;
    status?: string;
  } = {}): Promise<PaymentRecord[]> {
    let query = this.clients.read
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (filters.companyProfileId) {
      query = query.eq('company_profile_id', filters.companyProfileId);
    }
    if (filters.crewUserId) {
      query = query.eq('crew_user_id', filters.crewUserId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PaymentRecord[];
  }

  async listEscrowsByPaymentIds(paymentIds: string[]): Promise<EscrowRecord[]> {
    if (paymentIds.length === 0) return [];

    const { data, error } = await this.clients.read
      .from('escrow_records')
      .select(ESCROW_COLUMNS)
      .in('payment_id', paymentIds)
      .is('deleted_at', null);

    if (error) throw error;
    return (data ?? []) as EscrowRecord[];
  }

  async findActiveWithdrawalByPaymentId(paymentId: string) {
    const { data, error } = await this.clients.read
      .from('withdrawal_requests')
      .select(
        'id, payment_id, company_profile_id, crew_user_id, payout_method_id, amount, currency, status, status_version, requested_at, processed_at, created_at, updated_at, deleted_at',
      )
      .eq('payment_id', paymentId)
      .is('deleted_at', null)
      .not('status', 'in', '("rejected","cancelled")')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async listLedgerGroupsForPayment(paymentId: string, limit = 50) {
    const { data, error } = await this.clients.read
      .from('finance_transactions')
      .select(
        'id, ledger_entry_group_id, entry_sequence, payment_id, withdrawal_request_id, ledger_account, direction, transaction_type, amount, currency, posted_at',
      )
      .eq('payment_id', paymentId)
      .eq('status', 'posted')
      .is('deleted_at', null)
      .order('posted_at', { ascending: true })
      .limit(limit * 4);

    if (error) throw error;
    return data ?? [];
  }

  async listWorkflowEvents(paymentId: string, limit = 50) {
    const { data, error } = await this.clients.read
      .from('workflow_transition_events')
      .select(
        'workflow_event_id, entity_type, entity_id, from_status, to_status, transition_reason, transitioned_by, transition_source, idempotency_key, correlation_id, metadata, created_at',
      )
      .eq('entity_type', 'payment')
      .eq('entity_id', paymentId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}
