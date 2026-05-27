import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { CrewWalletBalanceRecord, CrewWalletRecord } from '@/modules/payments/types/wallet-records';
import type { WithdrawalRequestRecord } from '@/modules/payments/types/payment-records';

const WALLET_COLUMNS =
  'id, crew_user_id, default_currency, payouts_enabled, created_at, updated_at, deleted_at';

const BALANCE_COLUMNS =
  'crew_user_id, currency, available_balance, pending_balance, lifetime_earnings, last_ledger_entry_at';

const WITHDRAWAL_COLUMNS =
  'id, payment_id, company_profile_id, crew_user_id, payout_method_id, amount, currency, status, status_version, requested_at, processed_at, created_at, updated_at, deleted_at';

const LEDGER_ACTIVITY_COLUMNS =
  'id, ledger_entry_group_id, entry_sequence, payment_id, withdrawal_request_id, ledger_account, direction, transaction_type, amount, currency, posted_at';

type LedgerActivityRow = {
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
};

export class WalletRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findWalletByCrewUserId(crewUserId: string): Promise<CrewWalletRecord | null> {
    const { data, error } = await this.clients.read
      .from('crew_wallets')
      .select(WALLET_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as CrewWalletRecord | null;
  }

  async findBalanceByCrewUserId(crewUserId: string): Promise<CrewWalletBalanceRecord | null> {
    const { data, error } = await this.clients.read
      .from('crew_wallet_balances')
      .select(BALANCE_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .maybeSingle();

    if (error) throw error;
    return data as CrewWalletBalanceRecord | null;
  }

  async listWalletActivity(
    crewUserId: string,
    options: { limit?: number; cursor?: string } = {},
  ): Promise<LedgerActivityRow[]> {
    const limit = options.limit ?? 50;

    let query = this.clients.read
      .from('finance_transactions')
      .select(LEDGER_ACTIVITY_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .eq('status', 'posted')
      .in('ledger_account', ['crew_wallet_available', 'crew_wallet_pending'])
      .is('deleted_at', null)
      .order('posted_at', { ascending: false })
      .limit(limit);

    if (options.cursor) {
      query = query.lt('posted_at', options.cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as LedgerActivityRow[];
  }

  async listWithdrawals(crewUserId: string, limit = 50): Promise<WithdrawalRequestRecord[]> {
    const { data, error } = await this.clients.read
      .from('withdrawal_requests')
      .select(WITHDRAWAL_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as WithdrawalRequestRecord[];
  }

  async listPayoutMethodLabels(
    crewUserId: string,
  ): Promise<Map<string, string>> {
    const { data, error } = await this.clients.read
      .from('payout_methods')
      .select('id, display_name, method_type')
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null);

    if (error) throw error;

    const labels = new Map<string, string>();
    for (const row of data ?? []) {
      const label =
        (row.display_name as string | null) ??
        String(row.method_type)
          .split('_')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      labels.set(row.id as string, label);
    }
    return labels;
  }
}
