# Folder Structure — CrewAnywhere

Canonical `src/` layout is documented in `docs/architecture/folder-structure.md`. This is the top-level, whole-repo map (including meta/docs) so an AI can orient quickly. It indexes, not duplicates.

## Application code
- `src/app/` — Next.js App Router: layouts, pages, and route handlers
  - `src/app/(auth)/`, `src/app/(dashboard)/` — route groups (login, dashboard pages)
  - `src/app/api/v1/` — versioned API entrypoints (assignments, events, jobs, proposals, shifts, payments, wallets, withdrawals, auth, health, marketplace)
- `src/backend/` — backend-only primitives: `auth/` (platform identity, session, service context), `events/`, `policies/`, `repositories/`, `services/` (incl. `workflow/`, `outbox/`), `workers/`
- `src/domain/` — pure domain constants, statuses, and types (no I/O)
- `src/modules/<domain>/` — domain-owned modules (actions, components, hooks, repositories, schemas, services, types) for assignments, events, jobs, marketplace, notifications, payments, profiles, proposals, shifts, identity
- `src/shared/` — reusable cross-domain building blocks: `api/`, `auth/`, `config/`, `components/`, `design/`, `events/`, `hooks/`, `layouts/`, `lib/`, `state/` (enums, lifecycles, workflows), `supabase/`, `ui/`
- `src/proxy.ts` — Next.js middleware entry (wires `middleware/`)
- `middleware/` — route-protection config and SSR session refresh

## Database
- `schema.sql` — canonical unified Postgres schema (source of truth)
- `supabase/migrations/` — ordered migrations (`0001_unified_database_architecture.sql` … `0004_workflow_outbox_worker.sql`)
- `supabase/config.toml` — Supabase CLI config

## Deep docs (source of truth per domain)
- `docs/architecture/`, `docs/auth/`, `docs/database/`, `docs/payments/` — indexed from `docs/ai/ARCHITECTURE.md`

## Meta (not application code)
- `CLAUDE.md` — AI entry point
- `.cursor/rules/project.mdc` — Cursor rules
- `docs/ai/*` — implementation-truth docs (this folder)
- `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASKS.md` — project brain (high-level state)
- `README.md` — human-facing repo intro
- Root PDFs (`CANONICAL FDR STRUCTURE.pdf`, `CrewAnywhere2.0 — Master Architecture V4 …`, `…Technical_FDR_Standard.pdf`) — source design/FDR references

## Config
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `components.json`, `.env.example`

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`
