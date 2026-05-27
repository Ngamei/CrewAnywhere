# Ledger / UI Integration Notes

The UI must never imply that workflow tables hold balances. All monetary amounts in wallet views come from ledger read models.

## Layering

```
┌─────────────────────────────────────┐
│  Foundation UI (*-foundation.tsx)   │
├─────────────────────────────────────┤
│  Mappers (payment-activity,         │
│   wallet-activity, payment-timeline)│
├─────────────────────────────────────┤
│  Read models / DTOs                 │
├─────────────────────────────────────┤
│  API (future) → SELECT ledger/view   │
├─────────────────────────────────────┤
│  finance_transactions (immutable)   │
└─────────────────────────────────────┘
```

## Types

| Type | Purpose |
|------|---------|
| `FinanceLedgerEntry` | Minimal line in `shared/state/types/finance-ledger.ts` |
| `FinanceTransactionHistoryLine` | Full operational history row |
| `LedgerGroupTimelineDto` | Grouped double-entry movement |
| `TransactionHistoryItemDto` | Table row for payment detail |
| `WalletActivityFeedItem` | Crew feed item with group id |

## Display rules

1. Show **posted** ledger lines only in customer-facing history (pending/failed lines are ops-only).
2. Format amounts as strings matching DB `numeric` serialization to avoid float drift.
3. Label lines by `transaction_type` + `ledger_account`, not by payment status alone.
4. Reversals appear as new groups (`reversal` type), never as edited prior rows.

## Immutable ledger compatibility

- No UPDATE/DELETE paths in repositories for `finance_transactions`.
- UI mappers are pure functions — safe for SSR replay and cache invalidation by `ledger_entry_group_id`.
- Query keys include `ledgerHistory` and `activity` segments scoped by entity id.

## Workflow compatibility

Payment status badges reflect `payments.status`. When status is `funded` but ledger funding group is missing, reconciliation UI should surface `payment_funded_escrow_mismatch` (future).

## Auditability

Timeline entries preserve:

- `workflow_event_id` or transaction `id`
- `transition_source` / ledger `external_reference`
- ISO timestamps from DB

Foundation placeholders use deterministic UUID prefixes for visual QA only.
