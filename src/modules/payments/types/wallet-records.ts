/** Row shape for `public.crew_wallets`. */
export type CrewWalletRecord = {
  id: string;
  crew_user_id: string;
  default_currency: string;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Read shape for `public.crew_wallet_balances` view. */
export type CrewWalletBalanceRecord = {
  crew_user_id: string;
  currency: string;
  available_balance: string;
  pending_balance: string;
  lifetime_earnings: string;
  last_ledger_entry_at: string | null;
};
