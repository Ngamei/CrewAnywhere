import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { PaymentRecord, WithdrawalRequestRecord } from '@/modules/payments/types/payment-records';

const WITHDRAWAL_COLUMNS =
  'id, payment_id, company_profile_id, crew_user_id, payout_method_id, amount, currency, status, status_version, requested_at, processed_at, created_at, updated_at, deleted_at';

const PAYMENT_COLUMNS =
  'id, assignment_id, company_profile_id, crew_user_id, amount, currency, status, status_version, authorized_at, funded_at, released_at, created_at, updated_at, deleted_at';

const PAYOUT_METHOD_COLUMNS =
  'id, crew_user_id, method_type, provider, provider_reference, display_name, is_default, verified_at, created_at, updated_at, deleted_at';

export type PayoutMethodRecord = {
  id: string;
  crew_user_id: string;
  method_type: string;
  provider: string | null;
  provider_reference: string | null;
  display_name: string | null;
  is_default: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class WithdrawalRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<WithdrawalRequestRecord | null> {
    const { data, error } = await this.clients.read
      .from('withdrawal_requests')
      .select(WITHDRAWAL_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as WithdrawalRequestRecord | null;
  }

  async findActiveByPaymentId(paymentId: string): Promise<WithdrawalRequestRecord | null> {
    const { data, error } = await this.clients.read
      .from('withdrawal_requests')
      .select(WITHDRAWAL_COLUMNS)
      .eq('payment_id', paymentId)
      .is('deleted_at', null)
      .not('status', 'in', '("rejected","cancelled")')
      .maybeSingle();

    if (error) throw error;
    return data as WithdrawalRequestRecord | null;
  }

  async insertWithdrawal(input: {
    paymentId: string;
    companyProfileId: string;
    crewUserId: string;
    payoutMethodId: string;
    amount: string;
    currency: string;
  }): Promise<WithdrawalRequestRecord> {
    const { data, error } = await this.clients.write
      .from('withdrawal_requests')
      .insert({
        payment_id: input.paymentId,
        company_profile_id: input.companyProfileId,
        crew_user_id: input.crewUserId,
        payout_method_id: input.payoutMethodId,
        amount: input.amount,
        currency: input.currency,
        status: 'requested',
      })
      .select(WITHDRAWAL_COLUMNS)
      .single();

    if (error) throw error;
    return data as WithdrawalRequestRecord;
  }

  async markProcessedAt(withdrawalId: string, processedAt: string): Promise<WithdrawalRequestRecord> {
    const { data, error } = await this.clients.write
      .from('withdrawal_requests')
      .update({ processed_at: processedAt })
      .eq('id', withdrawalId)
      .is('deleted_at', null)
      .select(WITHDRAWAL_COLUMNS)
      .single();

    if (error) throw error;
    return data as WithdrawalRequestRecord;
  }

  async findPayoutMethod(id: string, crewUserId: string): Promise<PayoutMethodRecord | null> {
    const { data, error } = await this.clients.read
      .from('payout_methods')
      .select(PAYOUT_METHOD_COLUMNS)
      .eq('id', id)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as PayoutMethodRecord | null;
  }

  async findDefaultPayoutMethod(crewUserId: string): Promise<PayoutMethodRecord | null> {
    const { data, error } = await this.clients.read
      .from('payout_methods')
      .select(PAYOUT_METHOD_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .eq('is_default', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as PayoutMethodRecord;

    const { data: fallback, error: fallbackError } = await this.clients.read
      .from('payout_methods')
      .select(PAYOUT_METHOD_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    return fallback as PayoutMethodRecord | null;
  }

  async listPayoutMethods(crewUserId: string): Promise<PayoutMethodRecord[]> {
    const { data, error } = await this.clients.read
      .from('payout_methods')
      .select(PAYOUT_METHOD_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return (data ?? []) as PayoutMethodRecord[];
  }

  async findPaymentById(paymentId: string): Promise<PaymentRecord | null> {
    const { data, error } = await this.clients.read
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('id', paymentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as PaymentRecord | null;
  }

  async listWithdrawalSourcePayments(crewUserId: string, limit = 25): Promise<PaymentRecord[]> {
    const { data, error } = await this.clients.read
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .eq('status', 'released')
      .is('deleted_at', null)
      .order('released_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as PaymentRecord[];
  }

  async listWorkflowEvents(withdrawalId: string, limit = 50) {
    const { data, error } = await this.clients.read
      .from('workflow_transition_events')
      .select(
        'workflow_event_id, entity_type, entity_id, from_status, to_status, transition_reason, transitioned_by, transition_source, idempotency_key, correlation_id, metadata, created_at',
      )
      .eq('entity_type', 'withdrawal')
      .eq('entity_id', withdrawalId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}
