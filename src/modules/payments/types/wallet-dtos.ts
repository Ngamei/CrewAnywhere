import type { CrewWalletBalanceRecord, CrewWalletRecord } from './wallet-records';

export type WalletDto = CrewWalletRecord & {
  balance: CrewWalletBalanceRecord | null;
};

export type WalletBalanceSummaryDto = Pick<
  CrewWalletBalanceRecord,
  'available_balance' | 'pending_balance' | 'lifetime_earnings' | 'currency' | 'last_ledger_entry_at'
>;

export type WalletListItemDto = Pick<CrewWalletRecord, 'id' | 'crew_user_id' | 'default_currency' | 'payouts_enabled'> &
  WalletBalanceSummaryDto;
