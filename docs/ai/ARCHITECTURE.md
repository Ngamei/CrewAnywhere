# Architecture — CrewAnywhere

This file is an **index and map**, not a re-description. The authoritative deep docs already live under `docs/`; this points into them so an AI can find implementation truth fast.

## Type
Modular monolith. Next.js App Router (`next@16`, React 19) + TypeScript + Tailwind v4, backed by Supabase (Postgres, Auth, Realtime). Deployed on Vercel (target). No test framework wired yet.

## Request / control flow (high level)
1. `src/proxy.ts` runs `middleware/` (`handleSession`) to refresh the Supabase session cookie and protect routes.
2. Pages/route handlers live under `src/app/` (UI) and `src/app/api/v1/` (versioned API).
3. API handlers wrap logic with `src/shared/api/with-auth.ts`; auth is resolved via the platform session layer.
4. Domain logic lives in `src/modules/<domain>/` (services, repositories, schemas, components). Shared backend primitives live in `src/backend/`; pure domain constants/types in `src/domain/`.
5. Every state change goes through the atomic transition engine RPC `transition_workflow_entity(...)` (service-role only), which writes status + immutable transition event + audit log + outbox row in one transaction.
6. The outbox worker (`src/backend/workers/`, `src/backend/services/outbox/`) publishes `workflow_event_outbox` rows to Realtime/queue.

## Deep-doc index (source of truth per domain)

### Architecture rules — `docs/architecture/`
- `README.md` — canonical platform model, lifecycle, architecture style
- `folder-structure.md` — canonical `src/` layout and module rule
- `domain-boundaries.md` — what each domain owns (identity, events, jobs, proposals, assignments, shifts, payments, audit)
- `naming-conventions.md` — naming standards
- `mobile-readiness.md` — mobile/client-extraction considerations

### Auth & session — `docs/auth/`
- `architecture.md` — Supabase Auth + platform identity layer (`auth_accounts -> business_users / crew_users`), roles, guards
- `ownership-model.md` — ownership validators
- `rls-integration.md` — RLS policy model and helper functions
- `session-lifecycle.md` — session refresh and lifecycle
- Code: `src/shared/auth/`, `src/backend/auth/`, `src/shared/supabase/`, `middleware/`

### Database — `docs/database/`
- `architecture.md` — canonical schema (`schema.sql`), core layers, ERD, RLS recommendations (**start here for DB work**)
- `atomic-transition-engine.md` — `transition_workflow_entity(...)` contract, locking, idempotency, recovery
- `workflow-transition-system.md` — `workflow_transition_rules` / `workflow_transition_events`
- `status-event-synchronization.md` — status versions + executor-only status writes
- `workflow-lifecycle-hardening.md` — composite FKs + guard triggers on the operational chain
- `financial-ledger-architecture.md` — `finance_transactions` ledger-first accounting
- `outbox-architecture.md`, `outbox-retry-lifecycle.md`, `event-propagation-flow.md`, `migration-structure.md`
- Code: `supabase/migrations/`, `src/shared/state/workflows/`, `src/backend/services/workflow/`, `src/backend/services/outbox/`

### Payments — `docs/payments/`
- `architecture.md` — payments/wallet operational layer (Phase 2B; read models + UI shells, no provider integration yet)
- `escrow-lifecycle-mapping.md`, `ledger-ui-integration.md`, `wallet-operational-flow.md`
- Code: `src/modules/payments/`

## Key invariants
- Never bypass the atomic transition engine for state changes.
- Never mix `business_user` and `crew_user` logic.
- Schema changes go in `supabase/migrations/` only.
- Browser clients never call `transition_workflow_entity(...)` or write `finance_transactions` directly; those are service-role controlled.
