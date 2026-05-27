# Escrow Lifecycle Mapping

Escrow has **two parallel representations**:

1. **Workflow row** — `escrow_records.status` (`escrow_status` enum)
2. **Ledger truth** — posted groups with `transaction_type = 'escrow_funding'` / `'escrow_release'`

Phase 2B maps (1) for operational UI; (2) for balances and audit.

## Escrow status → operational meaning

| `escrow_status` | Operational meaning | Typical payment status |
|-----------------|---------------------|-------------------------|
| `awaiting_funding` | Escrow created, no funds posted | `authorized` |
| `partially_funded` | Partial provider capture | `authorized` |
| `funded` | Full hold in escrow account | `funded` |
| `held` | Awaiting shift / attendance guards | `funded` |
| `released` | Escrow debited, crew wallet credited | `released` |
| `refunded` | Funds returned to business | `refunded` |
| `disputed` | Dispute hold ledger groups | varies |

## Read model

`toEscrowReadModel` produces `EscrowReadModel` with:

- `fundingComplete` — status in `funded`, `held`, `released`
- `releaseEligible` — status in `funded`, `held`

## Timeline sources

`EscrowTimelineEntry` can be built from:

- Escrow row `updated_at` + status diffs (audit log / future history table)
- Payment workflow events when transition touches escrow guards
- Ledger group timestamps for funding/release

Foundation component: `EscrowTimelineFoundation` uses placeholder entries.

## Payment workflow guards (escrow-related)

From `payment-lifecycle.ts`:

| Transition | Guards |
|------------|--------|
| `fund_escrow` | `escrow_funded`, `ledger_group_balanced` |
| `release_payment` | `shift_completed`, `attendance_validated`, `ledger_group_balanced` |
| `refund_funded_payment` | `refund_approved`, `ledger_group_balanced` |

## Reconciliation flags

`ReconciliationViewDto.flags` includes `payment_funded_escrow_mismatch` when workflow status and ledger posted groups disagree (evaluated in future service layer).
