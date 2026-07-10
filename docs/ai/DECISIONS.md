# Architectural Decisions — CrewAnywhere

Architecture decisions for the codebase. Business/state decisions live in `../../DECISIONS.md` (do not duplicate).

## Modular monolith first
- Decision: modular monolith with explicit domain boundaries; extract services later along the same boundaries, not by page/UI.
- Consequences: strict no-cross-domain-imports rule (except via the shared layer, `src/backend` / `src/shared`).

## Atomic transition engine for all state changes
- Decision: all status transitions go through the transition engine.
- Consequences: no direct status mutation; predictable, auditable state. See `../database/atomic-transition-engine.md`.

## Separate business_users and crew_users behind auth_accounts
- Decision: keep the two user types in separate tables.
- Consequences: no shared/mixed user logic; auth indirection via `auth_accounts`. See `../auth/ownership-model.md`.

## Database-first, migrations only
- Decision: schema lives in `schema.sql` + Supabase migrations; no ad-hoc schema edits.
- Consequences: all schema change is reviewable and reproducible. See `../database/migration-structure.md`.
