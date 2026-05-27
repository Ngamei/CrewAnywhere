# Payments Operational Architecture (Phase 2B)

Phase 2B prepares the **operational layer** for CrewAnywhere2.0 payments and wallets. It does not implement provider integration, payout execution, or ledger writes.

## Scope

| In scope | Out of scope |
|----------|----------------|
| DTOs, read models, query keys | Stripe / provider SDK |
| Activity/timeline mappers | `finance_transactions` writes |
| Foundation UI shells | Workflow executor changes |
| Operational state mappings | Schema migrations |
| Documentation | Withdrawal execution |

## Module layout

```
src/modules/payments/
├── types/           # records, DTOs, read models, operational state
├── hooks/           # query keys, activity/timeline mappers
├── components/      # *-foundation.tsx placeholders
└── index.ts
```

Dashboard shells:

- `/dashboard/payments` — payment table, workflow timeline, escrow timeline
- `/dashboard/wallet` — balance cards, wallet activity feed

## Domain boundaries

- **Payments module** owns operational views over `payments`, `escrow_records`, and payment-scoped workflow history.
- **Wallet views** read `crew_wallets` metadata and `crew_wallet_balances` (ledger-derived).
- **Immutable ledger** (`finance_transactions`) remains the balance source of truth; UI only consumes read shapes.

## Workflow alignment

Payment and withdrawal lifecycle machines live in:

- `src/shared/state/workflows/payment-lifecycle.ts`
- `src/shared/state/workflows/withdrawal-lifecycle.ts`

Operational state (`resolvePaymentOperationalState`) maps `payment_status` to UI phases without duplicating transition rules.

## Query keys

Central registry: `src/shared/state/query-keys.ts`

- `queryKeys.payments.*` — from `payment-query-keys.ts`
- `queryKeys.wallets.*` — from `wallet-query-keys.ts`

## Next implementation steps

1. `PaymentRepository` / `WalletRepository` (read-only selects + RLS-aware filters)
2. API routes under `src/app/api/v1/payments` and `…/wallets`
3. Replace foundation placeholders with TanStack Query hooks wired to APIs
4. Replace `evaluatePaymentAuthorizedFoundation` stub with real guard evaluation

## References

- `docs/database/financial-ledger-architecture.md`
- `docs/payments/escrow-lifecycle-mapping.md`
- `docs/payments/ledger-ui-integration.md`
- `docs/payments/wallet-operational-flow.md`
