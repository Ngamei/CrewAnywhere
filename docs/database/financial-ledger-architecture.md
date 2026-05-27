# Financial Ledger Architecture

CrewAnywhere2.0 financial accounting is ledger-first. `finance_transactions` is the single source of truth for money movement.

Mutable payment, escrow, refund, withdrawal, and wallet records describe workflow state. They do not own balances.

## 1. Ledger Architecture

`finance_transactions` is an append-only double-entry ledger table.

Each accounting movement is represented by a `ledger_entry_group_id` with two or more entries. Posted entries in the same group must net to zero:

- credits increase a ledger account
- debits decrease a ledger account
- a deferred Postgres constraint trigger rejects unbalanced posted groups

Ledger account buckets:

- `business_cash`
- `escrow`
- `crew_wallet_pending`
- `crew_wallet_available`
- `platform_revenue`
- `refunds_payable`
- `withdrawal_clearing`
- `external_payout`
- `reconciliation`

Ledger transaction types:

- `escrow_funding`
- `escrow_release`
- `wallet_credit`
- `wallet_debit`
- `refund`
- `withdrawal`
- `withdrawal_payout`
- `platform_fee`
- `dispute_hold`
- `dispute_release`
- `reversal`
- `reconciliation_adjustment`

## 2. Wallet Computation Strategy

`crew_wallets` stores wallet metadata only:

- crew owner
- default currency
- payout enablement
- audit fields

Wallet balances are derived from `finance_transactions` through `crew_wallet_balances`.

Computed balances:

- `available_balance`: net posted entries for `crew_wallet_available`
- `pending_balance`: net posted entries for `crew_wallet_pending`
- `lifetime_earnings`: posted payment-release and wallet-credit credits into crew wallet accounts

There are no direct wallet balance mutations.

## 3. Transaction Flow Model

### Escrow Funding

Business funding creates a balanced group:

- debit `business_cash`
- credit `escrow`

### Payment Release

Operationally approved work releases escrow:

- debit `escrow`
- credit `crew_wallet_pending`

After hold/clearance:

- debit `crew_wallet_pending`
- credit `crew_wallet_available`

### Withdrawal

Crew withdrawal reserves available funds:

- debit `crew_wallet_available`
- credit `withdrawal_clearing`

External payout completion:

- debit `withdrawal_clearing`
- credit `external_payout`

### Refund

Refund reverses escrow or released funds depending on lifecycle state:

- debit `escrow` or crew/platform payable account
- credit `business_cash` or `refunds_payable`

### Dispute / Rollback

Disputes use new ledger groups. Existing financial rows are never updated:

- `dispute_hold`
- `dispute_release`
- `reversal`
- `reconciliation_adjustment`

## 4. Reconciliation Strategy

Reconciliation should compare:

- provider balance reports
- `escrow_records`
- `withdrawal_requests`
- `refunds`
- posted `finance_transactions`

All reconciliation differences must be represented as new ledger rows with `transaction_type = 'reconciliation_adjustment'`.

Never edit historical ledger entries to force a balance.

## 5. Withdrawal-to-Payment Traceability

Traceability path:

`withdrawal_requests.payment_id -> payments.assignment_id -> assignments.proposal_id -> proposals.job_id`

Ledger traceability:

`finance_transactions.withdrawal_request_id -> withdrawal_requests.payment_id -> payments.id`

Each active withdrawal is limited to one payment by `withdrawal_requests_payment_active_uidx`. Rejected or cancelled withdrawals may be retried.

## 6. Immutable Transaction Enforcement

Postgres enforcement:

- `finance_transactions_not_deleted` keeps `deleted_at` null.
- `prevent_finance_transaction_update` blocks updates.
- `prevent_finance_transaction_delete` blocks deletes.
- `guard_finance_transaction_insert` validates ownership context on insert.
- `guard_ledger_group_balanced_after_insert` validates balanced posted groups at transaction commit.
- `finance_transactions_idempotency_uidx` prevents duplicate financial commands.

Correction model:

- use `reversal_of_transaction_id`
- create new `reversal` entries
- create new `reconciliation_adjustment` entries

## 7. Accounting Integrity Recommendations

Backend services must:

- create all financial entries inside database transactions
- use deterministic `idempotency_key` values for payment provider events
- insert balanced debit/credit groups atomically
- verify currency consistency per ledger group
- reject withdrawal requests exceeding ledger-derived available balance
- store external provider references in immutable ledger metadata
- write workflow and audit events for every financial transition

## 8. Supabase/Postgres Implementation Strategy

Use service-role route handlers or RPC functions for all writes to:

- `payments`
- `escrow_records`
- `refunds`
- `withdrawal_requests`
- `finance_transactions`

Expose read access through RLS:

- crew users can read their own financial ledger and derived wallet balance
- business owners can read company-related ledger rows
- financial writes should not be allowed directly from browser clients

For production scale:

- partition `finance_transactions` by time once volume requires it
- add provider-specific reconciliation import tables later
- keep `finance_transactions` immutable even for support/admin workflows
- use read models or materialized views for finance dashboards
