# Architectural Decisions — CrewAnywhere

Implementation/architecture decisions for this repo. High-level product/state decisions live in the root [../../DECISIONS.md](../../DECISIONS.md) (do not duplicate). Use the standard item format: Date / Context / Options / Decision / Consequences.

## Modular monolith with explicit domain boundaries
- Date: (backfill from foundation)
- Context: a marketplace + operations + payments platform with several domains that must not couple.
- Options: modular monolith vs. microservices up front vs. flat app.
- Decision: modular monolith; each domain owns its module under `src/modules/<domain>/`; shared primitives stay generic in `src/shared/`.
- Consequences: features stay domain-scoped; future service extraction follows the same boundaries. See `docs/architecture/domain-boundaries.md` and `docs/architecture/folder-structure.md`.

## Separate `business_users` and `crew_users` behind `auth_accounts`
- Decision: two distinct actor tables bridged by `auth_accounts` (which bridges Supabase `auth.users`); domain tables never point at `auth.users` directly.
- Consequences: business and crew permissions/logic stay separate; one identity bridge for auth. See `docs/database/architecture.md` and `docs/auth/architecture.md`.

## Atomic transition engine for all state changes
- Decision: all lifecycle state changes go through `transition_workflow_entity(...)` (service-role, `security definer`), writing status + immutable transition event + audit log + outbox row atomically.
- Consequences: no scattered status writes; idempotent, replay-safe, auditable transitions. See `docs/database/atomic-transition-engine.md`.

## Ledger-first financials
- Decision: `finance_transactions` is the immutable append-only source of truth; wallet balances are derived (`crew_wallet_balances`).
- Consequences: money movement is auditable and reversible via compensating entries, not edits. See `docs/database/financial-ledger-architecture.md`.

## Schema changes via Supabase migrations only
- Decision: all schema changes land as ordered files in `supabase/migrations/`; `schema.sql` is the canonical baseline.
- Consequences: reproducible database state; no ad-hoc schema drift.

## AI docs layer indexes existing docs (this bootstrap)
- Date: 2026-07-09
- Context: the repo already has rich `docs/architecture|auth|database|payments`. A `/docs/ai/` layer was needed for AI onboarding without duplicating them.
- Decision: `/docs/ai/` is an index/map into the existing deep docs plus the standard Phase-1 files; it does not re-describe those domains.
- Consequences: single source of truth stays in `docs/<domain>/`; the AI layer stays thin and points there.
