import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type {
  FinanceTransactionInsert,
  FinanceTransactionRecord,
} from '@/modules/payments/types/finance-transaction-records';

const LEDGER_COLUMNS =
  'id, ledger_entry_group_id, entry_sequence, payment_id, escrow_record_id, refund_id, withdrawal_request_id, company_profile_id, crew_user_id, ledger_account, direction, transaction_type, status, amount, currency, idempotency_key, reversal_of_transaction_id, external_reference, metadata, posted_at, created_at, updated_at, deleted_at';

export class LedgerRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<FinanceTransactionRecord | null> {
    const { data, error } = await this.clients.read
      .from('finance_transactions')
      .select(LEDGER_COLUMNS)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (error) throw error;
    return data as FinanceTransactionRecord | null;
  }

  async listByLedgerGroupId(ledgerEntryGroupId: string): Promise<FinanceTransactionRecord[]> {
    const { data, error } = await this.clients.read
      .from('finance_transactions')
      .select(LEDGER_COLUMNS)
      .eq('ledger_entry_group_id', ledgerEntryGroupId)
      .order('entry_sequence', { ascending: true });

    if (error) throw error;
    return (data ?? []) as FinanceTransactionRecord[];
  }

  async listByWithdrawalRequestId(
    withdrawalRequestId: string,
    limit = 50,
  ): Promise<FinanceTransactionRecord[]> {
    const { data, error } = await this.clients.read
      .from('finance_transactions')
      .select(LEDGER_COLUMNS)
      .eq('withdrawal_request_id', withdrawalRequestId)
      .order('posted_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as FinanceTransactionRecord[];
  }

  async listByPaymentId(paymentId: string, limit = 100): Promise<FinanceTransactionRecord[]> {
    const { data, error } = await this.clients.read
      .from('finance_transactions')
      .select(LEDGER_COLUMNS)
      .eq('payment_id', paymentId)
      .order('posted_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as FinanceTransactionRecord[];
  }

  async insertEntry(input: FinanceTransactionInsert): Promise<FinanceTransactionRecord> {
    const { data, error } = await this.clients.write
      .from('finance_transactions')
      .insert({
        ledger_entry_group_id: input.ledger_entry_group_id,
        entry_sequence: input.entry_sequence,
        payment_id: input.payment_id ?? null,
        escrow_record_id: input.escrow_record_id ?? null,
        refund_id: input.refund_id ?? null,
        withdrawal_request_id: input.withdrawal_request_id ?? null,
        company_profile_id: input.company_profile_id ?? null,
        crew_user_id: input.crew_user_id ?? null,
        ledger_account: input.ledger_account,
        direction: input.direction,
        transaction_type: input.transaction_type,
        amount: input.amount,
        currency: input.currency,
        idempotency_key: input.idempotency_key,
        external_reference: input.external_reference ?? null,
        metadata: input.metadata ?? {},
        status: 'posted',
      })
      .select(LEDGER_COLUMNS)
      .single();

    if (error) throw error;
    return data as FinanceTransactionRecord;
  }

  async sumPostedGroupBalance(ledgerEntryGroupId: string): Promise<string> {
    const lines = await this.listByLedgerGroupId(ledgerEntryGroupId);
    const posted = lines.filter((line) => line.status === 'posted');
    const balance = posted.reduce((sum, line) => {
      const amount = Number.parseFloat(line.amount);
      return sum + (line.direction === 'credit' ? amount : -amount);
    }, 0);
    return balance.toFixed(2);
  }
}
