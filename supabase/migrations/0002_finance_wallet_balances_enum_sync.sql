-- Fix enum/view mismatch:
-- `finance_transaction_type` does not contain `payment_release`.
-- Payment-release credits are represented by `escrow_release` ledger transaction types.

create or replace view public.crew_wallet_balances
with (security_invoker = true) as
select
  crew_user_id,
  currency,
  coalesce(
    sum(amount) filter (
      where ledger_account = 'crew_wallet_available'
        and direction = 'credit'
        and status = 'posted'
    ),
    0
  )
  - coalesce(
    sum(amount) filter (
      where ledger_account = 'crew_wallet_available'
        and direction = 'debit'
        and status = 'posted'
    ),
    0
  ) as available_balance,
  coalesce(
    sum(amount) filter (
      where ledger_account = 'crew_wallet_pending'
        and direction = 'credit'
        and status = 'posted'
    ),
    0
  )
  - coalesce(
    sum(amount) filter (
      where ledger_account = 'crew_wallet_pending'
        and direction = 'debit'
        and status = 'posted'
    ),
    0
  ) as pending_balance,
  coalesce(
    sum(amount) filter (
      where ledger_account in ('crew_wallet_pending', 'crew_wallet_available')
        and direction = 'credit'
        and transaction_type in ('escrow_release', 'wallet_credit')
        and status = 'posted'
    ),
    0
  ) as lifetime_earnings,
  max(created_at) as last_ledger_entry_at
from public.finance_transactions
where crew_user_id is not null
  and deleted_at is null
group by crew_user_id, currency;

