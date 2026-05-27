# Wallet Operational Flow

Crew wallets are **metadata + derived balances**. Money movement is recorded only in the immutable ledger.

## Data sources

| Surface | Table / view | Mutable? |
|---------|--------------|----------|
| Wallet settings | `crew_wallets` | Yes (currency, payouts_enabled) |
| Balances | `crew_wallet_balances` | No (view over `finance_transactions`) |
| Activity feed | `finance_transactions` (filtered) | No (append-only) |
| Withdrawals | `withdrawal_requests` | Yes (workflow status) |

## Balance computation

- **Available** — net posted credits minus debits on `crew_wallet_available`
- **Pending** — net on `crew_wallet_pending`
- **Lifetime earnings** — posted credits with types `escrow_release`, `wallet_credit`

UI foundation: `WalletBalanceShellFoundation` displays these fields from `WalletBalanceSummaryDto`.

## Activity feed pipeline

```
finance_transactions (posted, crew-scoped)
  → FinanceTransactionHistoryLine
  → WalletActivityFeedItem
  → ActivityFeedItem (via mapWalletActivityToFeedItems)
```

Replay safety: feed items key on transaction `id` and `ledger_entry_group_id`; re-fetching the same ledger state yields identical ordering when sorted by `posted_at`.

## Withdrawal operational display

`toPayoutStatusDisplay` maps `withdrawal_requests` rows to `PayoutStatusDisplay` for crew-facing status cards. Ledger reservation groups are linked by `withdrawal_request_id` on ledger lines (future API).

## Query keys

```ts
walletQueryKeys.byCrewUser(crewUserId)
walletQueryKeys.balance(crewUserId)
walletQueryKeys.activity(crewUserId)
walletQueryKeys.withdrawals(crewUserId)
```

## Crew vs business visibility

- Crew: wallet page, activity, payout methods, withdrawal requests
- Business: payment/escrow views per assignment; no direct wallet balance mutation
